//! Automatic updates from GitHub releases. The app reads `latest.json` from the latest release,
//! verifies the signature with the public key in tauri.conf.json, installs and restarts.

use crate::{state, tray};
use serde::Serialize;
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tauri_plugin_updater::UpdaterExt;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    pub version: String,
    pub current: String,
    pub notes: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Progress {
    downloaded: u64,
    total: Option<u64>,
}

/// Checks GitHub for a newer version. Remembers and announces it when found.
pub async fn check(app: &AppHandle) -> Result<Option<UpdateInfo>, String> {
    let update = app
        .updater()
        .map_err(|e| e.to_string())?
        .check()
        .await
        .map_err(|e| format!("Could not check for updates: {e}"))?;
    let info = update.map(|u| UpdateInfo { version: u.version.clone(), current: u.current_version.clone(), notes: u.body.clone() });
    let st = state(app);
    let changed = {
        let mut g = st.update.lock().unwrap();
        let changed = g.as_ref().map(|i| &i.version) != info.as_ref().map(|i| &i.version);
        *g = info.clone();
        changed
    };
    if changed {
        if let Some(i) = &info {
            log::info!("update available: {}", i.version);
            let _ = app.emit("update://available", i);
        }
        tray::refresh(app);
    }
    Ok(info)
}

#[tauri::command]
pub async fn check_for_update(app: AppHandle) -> Result<Option<UpdateInfo>, String> {
    check(&app).await
}

/// Downloads, verifies and installs the update, then restarts PixelBuddy.
#[tauri::command]
pub async fn install_update(app: AppHandle) -> Result<(), String> {
    let update = app
        .updater()
        .map_err(|e| e.to_string())?
        .check()
        .await
        .map_err(|e| format!("Could not check for updates: {e}"))?
        .ok_or("You already have the latest version.")?;
    let mut downloaded = 0u64;
    let app2 = app.clone();
    update
        .download_and_install(
            move |chunk, total| {
                downloaded += chunk as u64;
                let _ = app2.emit("update://progress", Progress { downloaded, total });
            },
            || {},
        )
        .await
        .map_err(|e| format!("The update could not be installed: {e}"))?;
    app.restart();
}

/// Checks shortly after startup, then every six hours.
pub fn spawn_checks(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(Duration::from_secs(20)).await;
        loop {
            if let Err(e) = check(&app).await {
                log::info!("{e}");
            }
            tokio::time::sleep(Duration::from_secs(6 * 3600)).await;
        }
    });
}
