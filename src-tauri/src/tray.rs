use crate::{commands, state, windows};
use tauri::menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Wry};

pub struct TrayHandles {
    show: CheckMenuItem<Wry>,
    pause: CheckMenuItem<Wry>,
    update: MenuItem<Wry>,
}

pub fn build(app: &AppHandle) -> tauri::Result<TrayHandles> {
    let st = state(app);
    let settings = st.settings.read().unwrap().clone();
    let support = MenuItem::with_id(app, "support", "Buy me a coffee", true, None::<&str>)?;
    let revolut = MenuItem::with_id(app, "revolut", "Tip via Revolut", true, None::<&str>)?;
    let show = CheckMenuItem::with_id(app, "toggle_pets", "Show pets", true, !settings.pets_hidden, None::<&str>)?;
    let pause = CheckMenuItem::with_id(app, "pause", "Pause animations", true, settings.animations_paused, None::<&str>)?;
    let feed = MenuItem::with_id(app, "feed_all", "Feed everyone", true, None::<&str>)?;
    let play = MenuItem::with_id(app, "play_all", "Play with everyone", true, None::<&str>)?;
    let settings_item = MenuItem::with_id(app, "settings", "Settings...", true, None::<&str>)?;
    let streaming = MenuItem::with_id(app, "streaming", "Streaming and overlay...", true, None::<&str>)?;
    let update = MenuItem::with_id(app, "update", "Check for updates", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit PixelBuddy", true, None::<&str>)?;
    let menu = Menu::with_items(
        app,
        &[
            &show,
            &feed,
            &play,
            &pause,
            &PredefinedMenuItem::separator(app)?,
            &settings_item,
            &streaming,
            &support,
            &revolut,
            &PredefinedMenuItem::separator(app)?,
            &update,
            &quit,
        ],
    )?;

    TrayIconBuilder::with_id("main")
        .icon(app.default_window_icon().cloned().expect("app icon"))
        .tooltip("PixelBuddy")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "toggle_pets" => {
                let hidden = !state(app).settings.read().unwrap().pets_hidden;
                commands::apply_settings_patch(app, serde_json::json!({ "petsHidden": hidden }));
            }
            "pause" => {
                let paused = !state(app).settings.read().unwrap().animations_paused;
                commands::apply_settings_patch(app, serde_json::json!({ "animationsPaused": paused }));
            }
            "feed_all" => commands::perform_action(app, None, "feed", "user", None),
            "play_all" => commands::perform_action(app, None, "play", "user", None),
            "settings" => windows::show_settings(app, Some("pets")),
            "streaming" => windows::show_settings(app, Some("streaming")),
            "support" => {
                let _ = commands::open_support_link(app.clone(), None);
            }
            "revolut" => {
                let _ = commands::open_support_link(app.clone(), Some("revolut".into()));
            }
            "update" => {
                let has = state(app).update.lock().unwrap().is_some();
                if has {
                    let app = app.clone();
                    tauri::async_runtime::spawn(async move {
                        if let Err(e) = crate::updater::install_update(app.clone()).await {
                            log::warn!("{e}");
                        }
                    });
                } else {
                    windows::show_settings(app, Some("about"));
                    let _ = app.emit("update://check-requested", ());
                }
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                windows::show_settings(tray.app_handle(), None);
            }
        })
        .build(app)?;

    Ok(TrayHandles { show, pause, update })
}

pub fn refresh(app: &AppHandle) {
    let st = state(app);
    let guard = st.tray.lock().unwrap();
    let Some(t) = guard.as_ref() else { return };
    let s = st.settings.read().unwrap();
    let _ = t.show.set_checked(!s.pets_hidden);
    let _ = t.pause.set_checked(s.animations_paused);
    let label = match st.update.lock().unwrap().as_ref() {
        Some(u) => format!("Update to {}", u.version),
        None => "Check for updates".to_string(),
    };
    let _ = t.update.set_text(label);
}
