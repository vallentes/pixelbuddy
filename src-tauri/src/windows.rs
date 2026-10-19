use crate::{pets, state};
use std::collections::HashSet;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

pub const SPRITE: f64 = 32.0;

/// Must match `additionalBrowserArgs` of the main window in tauri.conf.json (WebView2 shares one
/// environment). Lets pets play their voices without a click first.
pub const BROWSER_ARGS: &str = "--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection --autoplay-policy=no-user-gesture-required";

/// Logical window size for a pet: room for the sprite plus a speech bubble above it.
pub fn pet_window_size(scale: f64) -> (f64, f64) {
    let s = SPRITE * scale;
    ((s + 120.0).max(300.0), s + 96.0)
}

pub fn pet_label(id: i64) -> String {
    format!("pet-{id}")
}

pub fn pet_id_from_label(label: &str) -> Option<i64> {
    label.strip_prefix("pet-")?.parse().ok()
}

/// Opens, keeps or closes pet windows so they match pets, visibility and onboarding.
pub fn sync_pet_windows(app: &AppHandle) {
    let st = state(app);
    let settings = st.settings.read().unwrap().clone();
    let allowed = !settings.pets_hidden && settings.onboarded;
    let pets = pets::list(&st.db).unwrap_or_default();
    let wanted: HashSet<String> =
        if allowed { pets.iter().filter(|p| p.visible).map(|p| pet_label(p.id)).collect() } else { HashSet::new() };

    for (label, win) in app.webview_windows() {
        if label.starts_with("pet-") && !wanted.contains(&label) {
            let _ = win.destroy();
        }
    }
    for p in pets.iter().filter(|p| wanted.contains(&pet_label(p.id))) {
        if app.get_webview_window(&pet_label(p.id)).is_none() {
            if let Err(e) = create_pet_window(app, p, settings.scale) {
                log::error!("could not open pet window {}: {e}", p.id);
            }
        }
    }
}

fn create_pet_window(app: &AppHandle, pet: &pets::Pet, scale: f64) -> tauri::Result<()> {
    let (w, h) = pet_window_size(scale);
    let b = WebviewWindowBuilder::new(app, pet_label(pet.id), WebviewUrl::App(format!("pet.html?id={}", pet.id).into()));
    #[cfg(windows)]
    let b = b.additional_browser_args(BROWSER_ARGS);
    b.title(&pet.name)
        .inner_size(w, h)
        .transparent(true)
        .decorations(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .shadow(false)
        .focused(false)
        .visible(false)
        .visible_on_all_workspaces(true)
        .build()?;
    Ok(())
}

pub fn show_settings(app: &AppHandle, section: Option<&str>) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
        if let Some(s) = section {
            let _ = app.emit_to("main", "ui://navigate", s);
        }
    }
}
