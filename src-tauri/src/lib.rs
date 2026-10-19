pub mod activity;
pub mod commands;
pub mod db;
pub mod overlay;
pub mod pets;
pub mod reactions;
pub mod secrets;
pub mod settings;
pub mod system;
pub mod tray;
pub mod twitch;
pub mod updater;
pub mod voice_model;
pub mod windows;

use crate::secrets::{KeychainStore, SecretStore};
use crate::settings::Settings;
use crate::system::SystemState;
use std::collections::HashSet;
use std::sync::{Arc, Mutex, RwLock};
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, RunEvent, WindowEvent};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use tauri_plugin_notification::NotificationExt;

pub fn now() -> i64 {
    std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_secs() as i64).unwrap_or(0)
}

pub struct AppState {
    pub db: Arc<db::Db>,
    pub secrets: Arc<dyn SecretStore>,
    pub settings: RwLock<Settings>,
    pub system: RwLock<SystemState>,
    pub bus: reactions::Bus,
    pub overlay: overlay::Overlay,
    pub twitch: twitch::Twitch,
    pub tray: Mutex<Option<tray::TrayHandles>>,
    pub update: Mutex<Option<updater::UpdateInfo>>,
    notified: Mutex<HashSet<(i64, &'static str)>>,
}

pub fn state(app: &AppHandle) -> Arc<AppState> {
    app.state::<Arc<AppState>>().inner().clone()
}

fn setup(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let dir = app.path().app_data_dir()?;
    std::fs::create_dir_all(&dir)?;
    let db = Arc::new(db::Db::open(&dir.join("pixelbuddy.db"))?);
    let settings = Settings::load(&db);
    let secrets: Arc<dyn SecretStore> = Arc::new(KeychainStore);
    let st = Arc::new(AppState {
        db,
        secrets,
        settings: RwLock::new(settings.clone()),
        system: RwLock::new(SystemState::default()),
        bus: reactions::Bus::default(),
        overlay: overlay::Overlay::default(),
        twitch: twitch::Twitch::default(),
        tray: Mutex::new(None),
        update: Mutex::new(None),
        notified: Mutex::new(HashSet::new()),
    });
    app.manage(st.clone());

    *st.tray.lock().unwrap() = Some(tray::build(app)?);

    // Keep the OS autostart entry in sync with the stored preference.
    let al = app.autolaunch();
    if al.is_enabled().unwrap_or(false) != settings.launch_at_startup {
        let _ = if settings.launch_at_startup { al.enable() } else { al.disable() };
    }

    let autostarted = std::env::args().any(|a| a == "--autostart");
    if !settings.onboarded || !autostarted {
        windows::show_settings(app, None);
    }

    windows::sync_pet_windows(app);
    overlay::apply(app);
    st.twitch.init(app);

    spawn_system_monitor(app.clone());
    activity::spawn(app.clone());
    spawn_needs_tick(app.clone());
    updater::spawn_checks(app.clone());
    Ok(())
}

/// Polls idle time and fullscreen state; pets sleep or hide accordingly.
fn spawn_system_monitor(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        loop {
            let st = state(&app);
            let s = st.settings.read().unwrap().clone();
            let next = SystemState {
                idle: s.sleep_when_idle && system::idle_seconds() >= s.idle_minutes as u64 * 60,
                fullscreen: s.pause_when_fullscreen && system::foreground_fullscreen(),
            };
            let changed = {
                let mut g = st.system.write().unwrap();
                let c = *g != next;
                *g = next;
                c
            };
            if changed {
                let _ = app.emit("system://state", next);
            }
            tokio::time::sleep(Duration::from_secs(if s.performance_mode { 4 } else { 2 })).await;
        }
    });
}

/// Once a minute: drift needs, persist, and send optional reminders.
fn spawn_needs_tick(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        loop {
            tokio::time::sleep(Duration::from_secs(60)).await;
            let st = state(&app);
            let settings = st.settings.read().unwrap().clone();
            let asleep = st.system.read().unwrap().idle;
            let list = pets::list(&st.db).unwrap_or_default();
            for mut p in list {
                pets::tick_needs(&mut p, 1.0, asleep);
                let _ = pets::save_needs(&st.db, &p);
                let _ = app.emit_to(windows::pet_label(p.id), "pet://updated", &p);
                remind(&app, &st, &settings, &p);
            }
            commands::emit_pets(&app);
        }
    });
}

fn remind(app: &AppHandle, st: &AppState, s: &Settings, p: &pets::Pet) {
    let mut n = st.notified.lock().unwrap();
    if p.hunger < 60.0 {
        n.remove(&(p.id, "hungry"));
    }
    if p.happiness > 40.0 {
        n.remove(&(p.id, "lonely"));
    }
    if !s.notifications || s.pets_hidden || !p.visible {
        return;
    }
    let (key, title, body) = if p.hunger >= 80.0 {
        ("hungry", format!("{} is hungry", p.name), "Right-click your pet or use the tray menu to feed them.".to_string())
    } else if p.happiness <= 25.0 {
        ("lonely", format!("{} misses you", p.name), "A little play time would cheer them up.".to_string())
    } else {
        return;
    };
    if n.insert((p.id, key)) {
        let _ = app.notification().builder().title(title).body(body).show();
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            windows::show_settings(app, None);
        }))
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .level_for("tungstenite", log::LevelFilter::Warn)
                .level_for("reqwest", log::LevelFilter::Warn)
                .build(),
        )
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--autostart"])))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .register_uri_scheme_protocol("pbmodel", voice_model::protocol)
        .setup(|app| {
            setup(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_bootstrap,
            commands::update_settings,
            commands::get_pet_bootstrap,
            commands::create_pet,
            commands::update_pet,
            commands::delete_pet,
            commands::pet_action,
            commands::save_pet_position,
            commands::get_monitors,
            commands::cursor_position,
            commands::mouse_button_down,
            commands::open_support_link,
            updater::check_for_update,
            updater::install_update,
            commands::overlay_status,
            commands::send_test_reaction,
            commands::twitch_status,
            commands::twitch_begin_login,
            commands::twitch_cancel_login,
            commands::twitch_disconnect,
            commands::twitch_reconnect,
            commands::twitch_list_rewards,
            commands::twitch_set_reward_action,
            commands::show_settings,
            commands::open_data_folder,
            commands::save_clip,
            commands::pause_activity,
            commands::activity_paused,
            commands::quit_app,
            voice_model::voice_model_ready,
            voice_model::voice_model_download,
        ])
        .build(tauri::generate_context!())
        .expect("error while building PixelBuddy")
        .run(|_app, event| {
            // Pets and the hidden settings window come and go; only an explicit Quit exits.
            if let RunEvent::ExitRequested { api, code, .. } = event {
                if code.is_none() {
                    api.prevent_exit();
                }
            }
        });
}
