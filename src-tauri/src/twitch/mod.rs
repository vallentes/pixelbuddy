//! Optional Twitch integration: OAuth device-code flow (public client, no secret shipped),
//! Helix calls and EventSub over WebSocket. Tokens live only in the OS keychain and in this
//! module's memory; they are never emitted to the webview or written to logs.

pub mod events;

use crate::secrets::{Secret, SecretStore};
use crate::{commands, now, state};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::VecDeque;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{async_runtime::JoinHandle, AppHandle, Emitter};
use tauri_plugin_opener::OpenerExt;
use tokio_tungstenite::tungstenite::Message;

const SCOPES: &str = "moderator:read:followers channel:read:subscriptions channel:read:redemptions bits:read";
const KC_TOKENS: &str = "twitch_tokens";
const EVENTSUB_URL: &str = "wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=30";

#[derive(Serialize, Deserialize)]
struct Tokens {
    access_token: String,
    refresh_token: String,
    expires_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Account {
    pub user_id: String,
    pub login: String,
    pub display_name: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PendingLogin {
    pub user_code: String,
    pub verification_uri: String,
    pub expires_at: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SubStatus {
    pub kind: String,
    pub label: String,
    pub ok: bool,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct TwitchStatus {
    pub client_id_configured: bool,
    pub account: Option<Account>,
    pub pending: Option<PendingLogin>,
    /// "off" | "connecting" | "connected" | "error"
    pub eventsub: String,
    pub subscriptions: Vec<SubStatus>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Reward {
    pub id: String,
    pub title: String,
    pub cost: i64,
    pub action: Option<String>,
    pub pet_id: Option<i64>,
}

#[derive(Default)]
pub struct Twitch {
    status: Mutex<TwitchStatus>,
    login_task: Mutex<Option<JoinHandle<()>>>,
    eventsub_task: Mutex<Option<JoinHandle<()>>>,
    refresh_lock: tokio::sync::Mutex<()>,
}

fn http() -> reqwest::Client {
    reqwest::Client::builder().timeout(Duration::from_secs(15)).build().expect("http client")
}

fn client_id(app: &AppHandle) -> String {
    state(app).settings.read().unwrap().twitch_client_id.clone()
}

fn secrets(app: &AppHandle) -> Arc<dyn SecretStore> {
    state(app).secrets.clone()
}

fn load_tokens(app: &AppHandle) -> Option<Tokens> {
    secrets(app).get(KC_TOKENS).and_then(|s| serde_json::from_str(s.expose()).ok())
}

fn save_tokens(app: &AppHandle, t: &Tokens) -> Result<(), String> {
    secrets(app).set(KC_TOKENS, &Secret::new(serde_json::to_string(t).expect("tokens serialize")))
}

fn load_account(app: &AppHandle) -> Option<Account> {
    state(app).db.kv_get("twitch_account").ok().flatten().and_then(|s| serde_json::from_str(&s).ok())
}

impl Twitch {
    pub fn status(&self) -> TwitchStatus {
        self.status.lock().unwrap().clone()
    }

    fn update(&self, app: &AppHandle, f: impl FnOnce(&mut TwitchStatus)) {
        let snapshot = {
            let mut s = self.status.lock().unwrap();
            f(&mut s);
            s.client_id_configured = !client_id(app).is_empty();
            s.clone()
        };
        let _ = app.emit("twitch://status", snapshot);
    }

    /// Called at startup: restore the account and reconnect EventSub if we have tokens.
    pub fn init(&self, app: &AppHandle) {
        let account = load_account(app);
        let has_tokens = load_tokens(app).is_some();
        self.update(app, |s| {
            s.account = account.clone().filter(|_| has_tokens);
            s.eventsub = "off".into();
        });
        if account.is_some() && has_tokens {
            self.start_eventsub(app);
        }
    }

    pub async fn begin_login(&self, app: &AppHandle) -> Result<PendingLogin, String> {
        let cid = client_id(app);
        if cid.is_empty() {
            return Err("Add your Twitch application Client ID first (Streaming settings).".into());
        }
        #[derive(Deserialize)]
        struct DeviceResp {
            device_code: String,
            user_code: String,
            verification_uri: String,
            expires_in: i64,
            interval: u64,
        }
        let res = http()
            .post("https://id.twitch.tv/oauth2/device")
            .form(&[("client_id", cid.as_str()), ("scopes", SCOPES)])
            .send()
            .await
            .map_err(|_| "Could not reach Twitch. Check your connection.".to_string())?;
        if !res.status().is_success() {
            return Err(format!("Twitch rejected the login request ({}). Check the Client ID and that the app is a Public client.", res.status()));
        }
        let d: DeviceResp = res.json().await.map_err(|_| "Unexpected response from Twitch.".to_string())?;
        let pending = PendingLogin { user_code: d.user_code, verification_uri: d.verification_uri.clone(), expires_at: now() + d.expires_in };
        self.update(app, |s| {
            s.pending = Some(pending.clone());
            s.error = None;
        });
        let _ = app.opener().open_url(&d.verification_uri, None::<&str>);

        let app2 = app.clone();
        let device_code = Secret::new(d.device_code);
        let handle = tauri::async_runtime::spawn(async move {
            let st = state(&app2);
            let tw = &st.twitch;
            let result = poll_device(&app2, &cid, &device_code, d.interval.max(1), now() + d.expires_in).await;
            match result {
                Ok(()) => {
                    tw.update(&app2, |s| s.pending = None);
                    tw.start_eventsub(&app2);
                }
                Err(e) => tw.update(&app2, |s| {
                    s.pending = None;
                    s.error = Some(e);
                }),
            }
        });
        if let Some(old) = self.login_task.lock().unwrap().replace(handle) {
            old.abort();
        }
        Ok(pending)
    }

    pub fn cancel_login(&self, app: &AppHandle) {
        if let Some(h) = self.login_task.lock().unwrap().take() {
            h.abort();
        }
        self.update(app, |s| s.pending = None);
    }

    pub async fn disconnect(&self, app: &AppHandle) {
        self.stop_eventsub();
        if let Some(t) = load_tokens(app) {
            let cid = client_id(app);
            let _ = http()
                .post("https://id.twitch.tv/oauth2/revoke")
                .form(&[("client_id", cid.as_str()), ("token", t.access_token.as_str())])
                .send()
                .await;
        }
        secrets(app).delete(KC_TOKENS);
        let _ = state(app).db.kv_delete("twitch_account");
        self.update(app, |s| {
            *s = TwitchStatus { eventsub: "off".into(), ..Default::default() };
        });
    }

    /// Returns a valid access token, refreshing it when it is about to expire.
    async fn access_token(&self, app: &AppHandle, force_refresh: bool) -> Result<Secret, String> {
        let _guard = self.refresh_lock.lock().await;
        let t = load_tokens(app).ok_or("Not connected to Twitch.")?;
        if !force_refresh && t.expires_at - 120 > now() {
            return Ok(Secret::new(t.access_token));
        }
        let cid = client_id(app);
        let res = http()
            .post("https://id.twitch.tv/oauth2/token")
            .form(&[("client_id", cid.as_str()), ("grant_type", "refresh_token"), ("refresh_token", t.refresh_token.as_str())])
            .send()
            .await
            .map_err(|_| "Could not reach Twitch.".to_string())?;
        if !res.status().is_success() {
            secrets(app).delete(KC_TOKENS);
            let msg = "Your Twitch session expired. Connect again.".to_string();
            self.update(app, |s| {
                s.account = None;
                s.eventsub = "off".into();
                s.error = Some(msg.clone());
            });
            return Err(msg);
        }
        let tok = parse_tokens(res).await?;
        save_tokens(app, &tok)?;
        Ok(Secret::new(tok.access_token))
    }

    async fn helix(&self, app: &AppHandle, method: reqwest::Method, path: &str, body: Option<Value>) -> Result<Value, String> {
        let cid = client_id(app);
        for attempt in 0..2 {
            let token = self.access_token(app, attempt == 1).await?;
            let mut req = http()
                .request(method.clone(), format!("https://api.twitch.tv/helix{path}"))
                .header("Client-Id", &cid)
                .bearer_auth(token.expose());
            if let Some(b) = &body {
                req = req.json(b);
            }
            let res = req.send().await.map_err(|_| "Could not reach Twitch.".to_string())?;
            let status = res.status();
            let v: Value = res.json().await.unwrap_or(Value::Null);
            if status.as_u16() == 401 && attempt == 0 {
                continue;
            }
            if !status.is_success() {
                let msg = v.get("message").and_then(|m| m.as_str()).unwrap_or("request failed");
                return Err(format!("Twitch: {msg}"));
            }
            return Ok(v);
        }
        Err("Twitch authorization failed.".into())
    }

    pub async fn list_rewards(&self, app: &AppHandle) -> Result<Vec<Reward>, String> {
        let acc = load_account(app).ok_or("Not connected to Twitch.")?;
        let v = self
            .helix(app, reqwest::Method::GET, &format!("/channel_points/custom_rewards?broadcaster_id={}", acc.user_id), None)
            .await?;
        let mapped = commands::reward_actions(&state(app).db);
        Ok(v.get("data")
            .and_then(|d| d.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|r| {
                        let id = r.get("id")?.as_str()?.to_string();
                        let m = mapped.get(&id);
                        Some(Reward {
                            title: r.get("title").and_then(|t| t.as_str()).unwrap_or_default().to_string(),
                            cost: r.get("cost").and_then(|c| c.as_i64()).unwrap_or(0),
                            action: m.map(|m| m.0.clone()),
                            pet_id: m.and_then(|m| m.1),
                            id,
                        })
                    })
                    .collect()
            })
            .unwrap_or_default())
    }

    fn stop_eventsub(&self) {
        if let Some(h) = self.eventsub_task.lock().unwrap().take() {
            h.abort();
        }
    }

    pub fn start_eventsub(&self, app: &AppHandle) {
        self.stop_eventsub();
        let app2 = app.clone();
        let h = tauri::async_runtime::spawn(async move { eventsub_loop(app2).await });
        *self.eventsub_task.lock().unwrap() = Some(h);
    }
}

async fn parse_tokens(res: reqwest::Response) -> Result<Tokens, String> {
    #[derive(Deserialize)]
    struct T {
        access_token: String,
        refresh_token: String,
        expires_in: i64,
    }
    let t: T = res.json().await.map_err(|_| "Unexpected token response from Twitch.".to_string())?;
    Ok(Tokens { access_token: t.access_token, refresh_token: t.refresh_token, expires_at: now() + t.expires_in })
}

async fn poll_device(app: &AppHandle, cid: &str, device_code: &Secret, mut interval: u64, deadline: i64) -> Result<(), String> {
    loop {
        tokio::time::sleep(Duration::from_secs(interval)).await;
        if now() > deadline {
            return Err("The Twitch login code expired. Try again.".into());
        }
        let res = http()
            .post("https://id.twitch.tv/oauth2/token")
            .form(&[
                ("client_id", cid),
                ("scopes", SCOPES),
                ("device_code", device_code.expose()),
                ("grant_type", "urn:ietf:params:oauth:grant-type:device_code"),
            ])
            .send()
            .await;
        let Ok(res) = res else { continue };
        if res.status().is_success() {
            let tokens = parse_tokens(res).await?;
            save_tokens(app, &tokens)?;
            let account = validate(&tokens.access_token).await?;
            state(app).db.kv_set("twitch_account", &serde_json::to_string(&account).unwrap()).map_err(|e| e.to_string())?;
            state(app).twitch.update(app, |s| {
                s.account = Some(account.clone());
                s.error = None;
            });
            log::info!("twitch connected");
            return Ok(());
        }
        let body: Value = res.json().await.unwrap_or(Value::Null);
        match body.get("message").and_then(|m| m.as_str()).unwrap_or_default() {
            "authorization_pending" => {}
            "slow_down" => interval += 5,
            "invalid device code" => return Err("The Twitch login code expired. Try again.".into()),
            "access_denied" => return Err("Twitch access was denied.".into()),
            other => return Err(format!("Twitch login failed: {other}")),
        }
    }
}

async fn validate(access_token: &str) -> Result<Account, String> {
    let v: Value = http()
        .get("https://id.twitch.tv/oauth2/validate")
        .header("Authorization", format!("OAuth {access_token}"))
        .send()
        .await
        .map_err(|_| "Could not reach Twitch.".to_string())?
        .json()
        .await
        .map_err(|_| "Unexpected validate response.".to_string())?;
    let login = v.get("login").and_then(|l| l.as_str()).ok_or("Twitch token is invalid.")?.to_string();
    Ok(Account {
        user_id: v.get("user_id").and_then(|l| l.as_str()).unwrap_or_default().to_string(),
        display_name: login.clone(),
        login,
    })
}

async fn subscribe_all(app: &AppHandle, session_id: &str, account: &Account) {
    let st = state(app);
    let tw = &st.twitch;
    let mut results = Vec::new();
    for (kind, version, label) in events::SUBSCRIPTIONS {
        let body = serde_json::json!({
            "type": kind,
            "version": version,
            "condition": events::condition(kind, &account.user_id),
            "transport": { "method": "websocket", "session_id": session_id },
        });
        let r = tw.helix(app, reqwest::Method::POST, "/eventsub/subscriptions", Some(body)).await;
        results.push(SubStatus {
            kind: kind.to_string(),
            label: label.to_string(),
            ok: r.is_ok(),
            message: r.err().map(|e| {
                if e.contains("partner or affiliate") || e.contains("subscription missing proper authorization") {
                    "Needs Twitch Affiliate or Partner".to_string()
                } else {
                    e
                }
            }),
        });
    }
    tw.update(app, |s| s.subscriptions = results);
}

async fn eventsub_loop(app: AppHandle) {
    let mut url = EVENTSUB_URL.to_string();
    let mut backoff = 2u64;
    let mut seen: VecDeque<String> = VecDeque::new();
    let mut resubscribe = true;
    loop {
        let st_outer = state(&app);
        let tw = &st_outer.twitch;
        let Some(account) = load_account(&app) else { return };
        tw.update(&app, |s| s.eventsub = "connecting".into());
        let ws = match tokio_tungstenite::connect_async(url.as_str()).await {
            Ok((ws, _)) => ws,
            Err(e) => {
                log::warn!("eventsub connect failed: {e}");
                tw.update(&app, |s| s.eventsub = "error".into());
                tokio::time::sleep(Duration::from_secs(backoff)).await;
                backoff = (backoff * 2).min(120);
                url = EVENTSUB_URL.into();
                resubscribe = true;
                continue;
            }
        };
        let (mut tx, mut rx) = ws.split();
        let mut next_url: Option<String> = None;
        let mut keepalive = 40u64;
        loop {
            let msg = match tokio::time::timeout(Duration::from_secs(keepalive + 10), rx.next()).await {
                Ok(Some(Ok(m))) => m,
                _ => break,
            };
            let text = match msg {
                Message::Text(t) => t.to_string(),
                Message::Ping(p) => {
                    let _ = tx.send(Message::Pong(p)).await;
                    continue;
                }
                Message::Close(_) => break,
                _ => continue,
            };
            let Ok(v) = serde_json::from_str::<Value>(&text) else { continue };
            let mtype = v.pointer("/metadata/message_type").and_then(|m| m.as_str()).unwrap_or_default();
            let mid = v.pointer("/metadata/message_id").and_then(|m| m.as_str()).unwrap_or_default().to_string();
            if !mid.is_empty() {
                if seen.contains(&mid) {
                    continue;
                }
                seen.push_back(mid);
                if seen.len() > 200 {
                    seen.pop_front();
                }
            }
            match mtype {
                "session_welcome" => {
                    backoff = 2;
                    keepalive = v.pointer("/payload/session/keepalive_timeout_seconds").and_then(|k| k.as_u64()).unwrap_or(30);
                    tw.update(&app, |s| {
                        s.eventsub = "connected".into();
                        s.error = None;
                    });
                    if resubscribe {
                        if let Some(id) = v.pointer("/payload/session/id").and_then(|i| i.as_str()) {
                            subscribe_all(&app, id, &account).await;
                        }
                    }
                }
                "notification" => {
                    let kind = v.pointer("/payload/subscription/type").and_then(|k| k.as_str()).unwrap_or_default();
                    let ev = v.pointer("/payload/event").cloned().unwrap_or(Value::Null);
                    let st = state(&app);
                    let settings = st.settings.read().unwrap().clone();
                    let rewards = commands::reward_actions(&st.db);
                    if let Some(r) = events::to_reaction(kind, &ev, &settings, |id| rewards.get(id).cloned()) {
                        commands::perform_action(&app, r.pet_id, &r.action, "twitch", r.label.clone());
                    }
                }
                "session_reconnect" => {
                    next_url = v.pointer("/payload/session/reconnect_url").and_then(|u| u.as_str()).map(str::to_string);
                    break;
                }
                "revocation" => {
                    let kind = v.pointer("/payload/subscription/type").and_then(|k| k.as_str()).unwrap_or_default().to_string();
                    tw.update(&app, |s| {
                        for sub in s.subscriptions.iter_mut().filter(|x| x.kind == kind) {
                            sub.ok = false;
                            sub.message = Some("Revoked by Twitch. Reconnect to restore.".into());
                        }
                    });
                }
                _ => {}
            }
        }
        match next_url {
            Some(u) => {
                url = u;
                resubscribe = false;
            }
            None => {
                tw.update(&app, |s| s.eventsub = "connecting".into());
                tokio::time::sleep(Duration::from_secs(backoff)).await;
                backoff = (backoff * 2).min(120);
                url = EVENTSUB_URL.into();
                resubscribe = true;
            }
        }
    }
}
