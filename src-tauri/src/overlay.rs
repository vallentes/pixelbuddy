//! Local HTTP server for the OBS browser-source overlay. Bound to 127.0.0.1 only, with a Host
//! header check against DNS rebinding. Works with or without Twitch.

use crate::{pets, reactions::BusEvent, state, AppState};
use axum::{
    extract::{Path, Request, State},
    http::{header, HeaderValue, StatusCode},
    middleware::{self, Next},
    response::{
        sse::{Event, KeepAlive, Sse},
        IntoResponse, Redirect, Response,
    },
    routing::get,
    Json, Router,
};
use futures_util::StreamExt;
use serde::Serialize;
use std::{convert::Infallible, sync::Arc, sync::Mutex};
use tauri::{AppHandle, Emitter};
use tokio::sync::oneshot;
use tokio_stream::wrappers::BroadcastStream;

const DEV_ORIGIN: &str = "http://localhost:1420";

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OverlayStatus {
    pub enabled: bool,
    pub running: bool,
    pub url: String,
    pub error: Option<String>,
}

#[derive(Default)]
pub struct Overlay {
    running: Mutex<Option<(u16, oneshot::Sender<()>)>>,
    error: Mutex<Option<String>>,
}

#[derive(Clone)]
struct Ctx {
    app: AppHandle,
    st: Arc<AppState>,
    port: u16,
}

impl Overlay {
    pub fn status(&self, enabled: bool, port: u16) -> OverlayStatus {
        let running = self.running.lock().unwrap().as_ref().map(|r| r.0);
        OverlayStatus {
            enabled,
            running: running.is_some(),
            url: format!("http://127.0.0.1:{}/overlay", running.unwrap_or(port)),
            error: self.error.lock().unwrap().clone(),
        }
    }

    fn stop(&self) {
        if let Some((_, tx)) = self.running.lock().unwrap().take() {
            let _ = tx.send(());
        }
    }
}

/// Starts, restarts or stops the server to match the settings.
pub fn apply(app: &AppHandle) {
    let st = state(app);
    let (enabled, port) = {
        let s = st.settings.read().unwrap();
        (s.overlay_enabled, s.overlay_port)
    };
    let current = st.overlay.running.lock().unwrap().as_ref().map(|r| r.0);
    if enabled && current == Some(port) {
        return;
    }
    st.overlay.stop();
    *st.overlay.error.lock().unwrap() = None;
    if !enabled {
        emit_status(app);
        return;
    }
    let app2 = app.clone();
    tauri::async_runtime::spawn(async move {
        let st = state(&app2);
        match tokio::net::TcpListener::bind(("127.0.0.1", port)).await {
            Ok(listener) => {
                let (tx, rx) = oneshot::channel();
                *st.overlay.running.lock().unwrap() = Some((port, tx));
                emit_status(&app2);
                log::info!("overlay server on 127.0.0.1:{port}");
                let ctx = Ctx { app: app2.clone(), st: st.clone(), port };
                let r = axum::serve(listener, router(ctx)).with_graceful_shutdown(async { rx.await.ok(); }).await;
                if let Err(e) = r {
                    log::error!("overlay server stopped: {e}");
                }
            }
            Err(e) => {
                *st.overlay.error.lock().unwrap() =
                    Some(format!("Port {port} is in use or blocked ({e}). Pick another port in Streaming settings."));
                emit_status(&app2);
            }
        }
    });
}

fn emit_status(app: &AppHandle) {
    let st = state(app);
    let (enabled, port) = {
        let s = st.settings.read().unwrap();
        (s.overlay_enabled, s.overlay_port)
    };
    let _ = app.emit("overlay://status", st.overlay.status(enabled, port));
}

fn router(ctx: Ctx) -> Router {
    Router::new()
        .route("/", get(|| async { Redirect::to("/overlay") }))
        .route("/overlay", get(page))
        .route("/assets/*path", get(asset))
        .route("/api/state", get(api_state))
        .route("/api/events", get(api_events))
        .layer(middleware::from_fn_with_state(ctx.clone(), guard))
        .with_state(ctx)
}

/// Rejects requests whose Host is not our loopback address (blocks DNS-rebinding pages) and
/// adds no-store + CORS (dev only) headers.
async fn guard(State(ctx): State<Ctx>, req: Request, next: Next) -> Response {
    let host = req.headers().get(header::HOST).and_then(|h| h.to_str().ok()).unwrap_or_default();
    let ok = [format!("127.0.0.1:{}", ctx.port), format!("localhost:{}", ctx.port)];
    if !ok.iter().any(|h| h == host) {
        return (StatusCode::FORBIDDEN, "forbidden host").into_response();
    }
    let mut res = next.run(req).await;
    let h = res.headers_mut();
    h.insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    h.insert("x-content-type-options", HeaderValue::from_static("nosniff"));
    if tauri::is_dev() {
        h.insert(header::ACCESS_CONTROL_ALLOW_ORIGIN, HeaderValue::from_static(DEV_ORIGIN));
    }
    res
}

fn serve_asset(app: &AppHandle, path: &str) -> Response {
    match app.asset_resolver().get(path.to_string()) {
        Some(a) => {
            let mime = HeaderValue::from_str(a.mime_type()).unwrap_or(HeaderValue::from_static("application/octet-stream"));
            ([(header::CONTENT_TYPE, mime)], a.bytes().to_vec()).into_response()
        }
        None => (StatusCode::NOT_FOUND, "not found").into_response(),
    }
}

async fn page(State(ctx): State<Ctx>) -> Response {
    if tauri::is_dev() {
        return Redirect::temporary(&format!("{DEV_ORIGIN}/overlay.html?api=http://127.0.0.1:{}", ctx.port)).into_response();
    }
    serve_asset(&ctx.app, "overlay.html")
}

async fn asset(State(ctx): State<Ctx>, Path(path): Path<String>) -> Response {
    if path.contains("..") {
        return (StatusCode::BAD_REQUEST, "bad path").into_response();
    }
    serve_asset(&ctx.app, &format!("assets/{path}"))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct OverlayPet {
    id: i64,
    species: String,
    name: String,
    color: String,
    accessory: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OverlayState {
    allowed: bool,
    scale: f64,
    animation_speed: f64,
    walk_speed: f64,
    fps: u32,
    art_style: String,
    pets: Vec<OverlayPet>,
}

pub fn overlay_state(st: &AppState) -> OverlayState {
    let s = st.settings.read().unwrap().clone();
    let allowed = true;
    let pets = if allowed {
        pets::list(&st.db)
            .unwrap_or_default()
            .into_iter()
            .filter(|p| p.visible)
            .map(|p| OverlayPet { id: p.id, species: p.species, name: p.name, color: p.color, accessory: p.accessory })
            .collect()
    } else {
        vec![]
    };
    OverlayState { allowed, scale: s.overlay_scale, animation_speed: s.animation_speed, walk_speed: s.walk_speed, fps: s.fps, art_style: s.art_style, pets }
}

async fn api_state(State(ctx): State<Ctx>) -> Json<OverlayState> {
    Json(overlay_state(&ctx.st))
}

async fn api_events(State(ctx): State<Ctx>) -> Sse<impl futures_util::Stream<Item = Result<Event, Infallible>>> {
    let stream = BroadcastStream::new(ctx.st.bus.subscribe()).filter_map(|m| async move {
        match m {
            Ok(ev @ BusEvent::StateChanged) => Event::default().event("state").json_data(ev).ok().map(Ok),
            Ok(ev @ BusEvent::Reaction(_)) => Event::default().event("reaction").json_data(ev).ok().map(Ok),
            _ => None,
        }
    });
    Sse::new(stream).keep_alive(KeepAlive::default())
}
