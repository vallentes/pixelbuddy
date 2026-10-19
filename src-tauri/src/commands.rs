//! Tauri commands. Everything the webviews can do goes through here.

use crate::overlay::{self, OverlayStatus};
use crate::pets::{self, Pet, PetPatch};
use crate::reactions::{self, Reaction};
use crate::settings::Settings;
use crate::system::{self, SystemState};
use crate::twitch::{PendingLogin, Reward, TwitchStatus};
use crate::{db::Db, now, state, tray, windows};
use serde::Serialize;
use std::collections::HashMap;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_autostart::ManagerExt as _;
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_opener::OpenerExt;

type CmdResult<T> = Result<T, String>;

fn err(e: impl std::fmt::Display) -> String {
    e.to_string()
}

// ---------------------------------------------------------------------------------------------
// Shared helpers used by commands, tray and background tasks
// ---------------------------------------------------------------------------------------------

pub fn emit_pets(app: &AppHandle) {
    let st = state(app);
    if let Ok(list) = pets::list(&st.db) {
        let _ = app.emit("pets://changed", &list);
    }
    st.bus.state_changed();
}

fn emit_pet(app: &AppHandle, pet: &Pet) {
    let _ = app.emit_to(windows::pet_label(pet.id), "pet://updated", pet);
}

/// Applies an action's effect on needs, then animates it on the pet windows and overlay.
pub fn perform_action(app: &AppHandle, pet_id: Option<i64>, action: &str, source: &str, label: Option<String>) {
    if !reactions::ACTIONS.contains(&action) {
        return;
    }
    let st = state(app);
    let targets: Vec<Pet> = match pet_id {
        Some(id) => pets::get(&st.db, id).into_iter().collect(),
        None => pets::list(&st.db).unwrap_or_default(),
    };
    for mut p in targets {
        if pets::apply_action(&mut p, action, now()) {
            let _ = pets::save_needs(&st.db, &p);
            emit_pet(app, &p);
        }
    }
    st.bus.react(
        app,
        Reaction { action: action.into(), pet_id, source: source.into(), label: label.map(|l| reactions::clean_label(&l)) },
    );
    if let Ok(list) = pets::list(&st.db) {
        let _ = app.emit_to("main", "pets://changed", &list);
    }
}

/// Updates settings and applies every side effect (windows, tray, overlay, autostart).
pub fn apply_settings_patch(app: &AppHandle, patch: serde_json::Value) -> Settings {
    let st = state(app);
    let (old, new) = {
        let mut guard = st.settings.write().unwrap();
        let old = guard.clone();
        *guard = old.patched(&patch);
        (old, guard.clone())
    };
    if let Err(e) = new.save(&st.db) {
        log::error!("could not save settings: {e}");
    }
    if old.launch_at_startup != new.launch_at_startup {
        let al = app.autolaunch();
        let r = if new.launch_at_startup { al.enable() } else { al.disable() };
        if let Err(e) = r {
            log::warn!("autostart change failed: {e}");
        }
    }
    if new.notifications && !old.notifications {
        let _ = app.notification().request_permission();
    }
    if old.pets_hidden != new.pets_hidden || old.onboarded != new.onboarded || old.scale != new.scale {
        windows::sync_pet_windows(app);
    }
    if old.overlay_enabled != new.overlay_enabled || old.overlay_port != new.overlay_port {
        overlay::apply(app);
    }
    if old.twitch_client_id != new.twitch_client_id {
        let _ = app.emit("twitch://status", st.twitch.status());
    }
    let _ = app.emit("settings://changed", &new);
    st.bus.state_changed();
    tray::refresh(app);
    new
}

pub fn reward_actions(db: &Db) -> HashMap<String, (String, Option<i64>)> {
    let c = db.conn();
    let Ok(mut st) = c.prepare("SELECT reward_id, action, pet_id FROM reward_actions") else { return HashMap::new() };
    st.query_map([], |r| Ok((r.get::<_, String>(0)?, (r.get::<_, String>(1)?, r.get::<_, Option<i64>>(2)?))))
        .map(|rows| rows.flatten().collect())
        .unwrap_or_default()
}

// ---------------------------------------------------------------------------------------------
// Bootstrap and settings
// ---------------------------------------------------------------------------------------------

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Bootstrap {
    version: String,
    platform: &'static str,
    settings: Settings,
    pets: Vec<Pet>,
    system: SystemState,
    overlay: OverlayStatus,
    twitch: TwitchStatus,
    max_pets: usize,
    update: Option<crate::updater::UpdateInfo>,
}

#[tauri::command]
pub fn get_bootstrap(app: AppHandle) -> CmdResult<Bootstrap> {
    let st = state(&app);
    let settings = st.settings.read().unwrap().clone();
    let out = Bootstrap {
        version: app.package_info().version.to_string(),
        platform: platform(),
        pets: pets::list(&st.db).map_err(err)?,
        system: *st.system.read().unwrap(),
        overlay: st.overlay.status(settings.overlay_enabled, settings.overlay_port),
        twitch: st.twitch.status(),
        max_pets: pets::MAX_PETS,
        update: st.update.lock().unwrap().clone(),
        settings,
    };
    Ok(out)
}

#[tauri::command]
pub async fn update_settings(app: AppHandle, patch: serde_json::Value) -> Settings {
    apply_settings_patch(&app, patch)
}

// ---------------------------------------------------------------------------------------------
// Pets
// ---------------------------------------------------------------------------------------------

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PetBootstrap {
    pet: Pet,
    settings: Settings,
    system: SystemState,
    monitors: Vec<MonitorInfo>,
}

#[tauri::command]
pub fn get_pet_bootstrap(app: AppHandle, id: i64) -> CmdResult<PetBootstrap> {
    let st = state(&app);
    let out = PetBootstrap {
        pet: pets::get(&st.db, id).map_err(err)?,
        settings: st.settings.read().unwrap().clone(),
        system: *st.system.read().unwrap(),
        monitors: monitors(&app),
    };
    Ok(out)
}

#[tauri::command]
pub async fn create_pet(app: AppHandle, species: String, name: String) -> CmdResult<Pet> {
    let st = state(&app);
    let p = pets::create(&st.db, &species, &name, now()).map_err(err)?;
    windows::sync_pet_windows(&app);
    emit_pets(&app);
    Ok(p)
}

#[tauri::command]
pub async fn update_pet(app: AppHandle, id: i64, patch: PetPatch) -> CmdResult<Pet> {
    let st = state(&app);
    let p = pets::update(&st.db, id, &patch).map_err(err)?;
    emit_pet(&app, &p);
    if patch.visible.is_some() {
        windows::sync_pet_windows(&app);
    }
    emit_pets(&app);
    Ok(p)
}

#[tauri::command]
pub async fn delete_pet(app: AppHandle, id: i64) -> CmdResult<()> {
    pets::delete(&state(&app).db, id).map_err(err)?;
    windows::sync_pet_windows(&app);
    emit_pets(&app);
    Ok(())
}

#[tauri::command]
pub async fn pet_action(app: AppHandle, pet_id: Option<i64>, action: String) -> CmdResult<()> {
    if !reactions::ACTIONS.contains(&action.as_str()) {
        return Err("unknown action".into());
    }
    perform_action(&app, pet_id, &action, "user", None);
    Ok(())
}

#[tauri::command]
pub fn save_pet_position(app: AppHandle, id: i64, x: f64, y: f64, monitor: Option<String>) -> CmdResult<()> {
    pets::save_position(&state(&app).db, id, x, y, monitor.as_deref()).map_err(err)
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MonitorInfo {
    name: String,
    x: i32,
    y: i32,
    width: u32,
    height: u32,
    work_x: i32,
    work_y: i32,
    work_width: u32,
    work_height: u32,
    scale_factor: f64,
    primary: bool,
}

pub fn monitors(app: &AppHandle) -> Vec<MonitorInfo> {
    let primary = app.primary_monitor().ok().flatten().map(|m| (m.position().x, m.position().y));
    app.available_monitors()
        .unwrap_or_default()
        .into_iter()
        .enumerate()
        .map(|(i, m)| {
            let wa = m.work_area();
            MonitorInfo {
                name: m.name().cloned().unwrap_or_else(|| format!("Display {}", i + 1)),
                x: m.position().x,
                y: m.position().y,
                width: m.size().width,
                height: m.size().height,
                work_x: wa.position.x,
                work_y: wa.position.y,
                work_width: wa.size.width,
                work_height: wa.size.height,
                scale_factor: m.scale_factor(),
                primary: primary == Some((m.position().x, m.position().y)),
            }
        })
        .collect()
}

#[tauri::command]
pub fn get_monitors(app: AppHandle) -> Vec<MonitorInfo> {
    monitors(&app)
}

#[tauri::command]
pub fn cursor_position(app: AppHandle) -> (f64, f64) {
    app.cursor_position().map(|p| (p.x, p.y)).unwrap_or((-1e6, -1e6))
}

#[tauri::command]
pub fn mouse_button_down() -> bool {
    system::left_button_down()
}

// ---------------------------------------------------------------------------------------------
// Support (donations)
// ---------------------------------------------------------------------------------------------

pub const COFFEE_URL: &str = "https://buymeacoffee.com/vallentes";
pub const REVOLUT_URL: &str = "https://revolut.me/vallentes";

/// Opens a donation page. Only these two fixed URLs can be opened, so the webview cannot open
/// arbitrary links through this command.
#[tauri::command]
pub fn open_support_link(app: AppHandle, kind: Option<String>) -> CmdResult<()> {
    let url = match kind.as_deref() {
        Some("revolut") => REVOLUT_URL,
        _ => COFFEE_URL,
    };
    app.opener().open_url(url, None::<&str>).map_err(err)
}

pub fn platform() -> &'static str {
    if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else {
        "linux"
    }
}

// ---------------------------------------------------------------------------------------------
// Streaming
// ---------------------------------------------------------------------------------------------

#[tauri::command]
pub fn overlay_status(app: AppHandle) -> OverlayStatus {
    let st = state(&app);
    let s = st.settings.read().unwrap();
    st.overlay.status(s.overlay_enabled, s.overlay_port)
}

#[tauri::command]
pub fn send_test_reaction(app: AppHandle, action: String) -> CmdResult<()> {
    if !reactions::ACTIONS.contains(&action.as_str()) {
        return Err("unknown action".into());
    }
    let st = state(&app);
    st.bus.react(&app, Reaction { action, pet_id: None, source: "test".into(), label: Some("Test reaction!".into()) });
    Ok(())
}

#[tauri::command]
pub fn twitch_status(app: AppHandle) -> TwitchStatus {
    state(&app).twitch.status()
}

#[tauri::command]
pub async fn twitch_begin_login(app: AppHandle) -> CmdResult<PendingLogin> {
    let st = state(&app);
    st.twitch.begin_login(&app).await
}

#[tauri::command]
pub fn twitch_cancel_login(app: AppHandle) {
    state(&app).twitch.cancel_login(&app);
}

#[tauri::command]
pub async fn twitch_disconnect(app: AppHandle) {
    let st = state(&app);
    st.twitch.disconnect(&app).await;
}

#[tauri::command]
pub fn twitch_reconnect(app: AppHandle) {
    state(&app).twitch.start_eventsub(&app);
}

#[tauri::command]
pub async fn twitch_list_rewards(app: AppHandle) -> CmdResult<Vec<Reward>> {
    let st = state(&app);
    st.twitch.list_rewards(&app).await
}

#[tauri::command]
pub fn twitch_set_reward_action(
    app: AppHandle,
    reward_id: String,
    reward_title: String,
    action: String,
    pet_id: Option<i64>,
) -> CmdResult<()> {
    let db = &state(&app).db;
    if action == "none" {
        db.conn().execute("DELETE FROM reward_actions WHERE reward_id = ?1", [&reward_id]).map_err(err)?;
        return Ok(());
    }
    if !reactions::ACTIONS.contains(&action.as_str()) {
        return Err("unknown action".into());
    }
    db.conn()
        .execute(
            "INSERT INTO reward_actions (reward_id, reward_title, action, pet_id) VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(reward_id) DO UPDATE SET reward_title = excluded.reward_title, action = excluded.action, pet_id = excluded.pet_id",
            rusqlite::params![reward_id, reactions::clean_label(&reward_title), action, pet_id],
        )
        .map_err(err)?;
    Ok(())
}

// ---------------------------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------------------------

#[tauri::command]
pub fn show_settings(app: AppHandle, section: Option<String>) {
    windows::show_settings(&app, section.as_deref());
}

#[tauri::command]
pub fn open_data_folder(app: AppHandle) -> CmdResult<()> {
    let dir = app.path().app_data_dir().map_err(err)?;
    app.opener().open_path(dir.to_string_lossy().to_string(), None::<&str>).map_err(err)
}

/// Saves a clip from "Record My Buddy" (raw video bytes in the request body) to
/// Videos/PixelBuddy and shows it in the file manager.
#[tauri::command]
pub fn save_clip(app: AppHandle, request: tauri::ipc::Request<'_>) -> CmdResult<String> {
    let tauri::ipc::InvokeBody::Raw(bytes) = request.body() else {
        return Err("Expected video data.".into());
    };
    if bytes.is_empty() || bytes.len() > 300 * 1024 * 1024 {
        return Err("The clip is empty or too large.".into());
    }
    let ext = match request.headers().get("x-pb-ext").and_then(|v| v.to_str().ok()) {
        Some("mp4") => "mp4",
        _ => "webm",
    };
    let base = app.path().video_dir().or_else(|_| app.path().download_dir()).map_err(err)?;
    let dir = base.join("PixelBuddy");
    std::fs::create_dir_all(&dir).map_err(err)?;
    let path = dir.join(format!("PixelBuddy-{}.{ext}", now()));
    std::fs::write(&path, bytes).map_err(err)?;
    let _ = app.opener().reveal_item_in_dir(&path);
    Ok(path.to_string_lossy().into_owned())
}

/// Pauses "React to what I'm doing" for `minutes` (0 resumes).
#[tauri::command]
pub fn pause_activity(app: AppHandle, minutes: i64) {
    if minutes > 0 {
        crate::activity::pause_for(minutes.min(24 * 60));
    } else {
        crate::activity::resume();
    }
    tray::refresh(&app);
}

#[tauri::command]
pub fn activity_paused() -> bool {
    crate::activity::paused()
}

#[tauri::command]
pub fn quit_app(app: AppHandle) {
    app.exit(0);
}
