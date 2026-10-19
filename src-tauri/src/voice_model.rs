//! Downloads the free Kokoro-82M voice model (Apache-2.0) into the app data folder once, and
//! serves it to the webviews through the private `pbmodel://` protocol, so voices work offline
//! and the large model never depends on the browser cache.

use futures_util::StreamExt;
use serde::Serialize;
use std::path::{Component, Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::http::{Request, Response, StatusCode};
use tauri::{AppHandle, Emitter, Manager, Runtime, UriSchemeContext};
use tokio::io::AsyncWriteExt;

pub const MODEL_ID: &str = "onnx-community/Kokoro-82M-v1.0-ONNX";
const BASE: &str = "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main";

static DOWNLOADING: AtomicBool = AtomicBool::new(false);

/// Files needed for a model variant. `fp32` runs on the GPU, `q8` on the CPU.
pub fn files_for(variant: &str) -> Option<Vec<&'static str>> {
    let model = match variant {
        "fp32" => "onnx/model.onnx",
        "fp16" => "onnx/model_fp16.onnx",
        "q8" => "onnx/model_quantized.onnx",
        _ => return None,
    };
    Some(vec!["config.json", "tokenizer.json", "tokenizer_config.json", model])
}

fn root(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app.path().app_data_dir().map_err(|e| e.to_string())?.join("voice-models"))
}

fn model_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(root(app)?.join(MODEL_ID.replace('/', std::path::MAIN_SEPARATOR_STR)))
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct Progress {
    file: String,
    loaded: u64,
    total: u64,
    overall: f64,
}

#[tauri::command]
pub fn voice_model_ready(app: AppHandle, variant: String) -> Result<bool, String> {
    let files = files_for(&variant).ok_or("unknown variant")?;
    let dir = model_dir(&app)?;
    Ok(files.iter().all(|f| dir.join(f).is_file()))
}

#[tauri::command]
pub async fn voice_model_download(app: AppHandle, variant: String) -> Result<(), String> {
    let files = files_for(&variant).ok_or("unknown variant")?;
    if DOWNLOADING.swap(true, Ordering::SeqCst) {
        return Err("A voice download is already running.".into());
    }
    let r = download(&app, &files).await;
    DOWNLOADING.store(false, Ordering::SeqCst);
    r
}

async fn download(app: &AppHandle, files: &[&str]) -> Result<(), String> {
    let dir = model_dir(app)?;
    let http = reqwest::Client::builder().user_agent("PixelBuddy").build().map_err(|e| e.to_string())?;
    let n = files.len() as f64;
    for (i, file) in files.iter().enumerate() {
        let dest = dir.join(file);
        if dest.is_file() {
            continue;
        }
        if let Some(parent) = dest.parent() {
            tokio::fs::create_dir_all(parent).await.map_err(|e| e.to_string())?;
        }
        let res = http
            .get(format!("{BASE}/{file}"))
            .send()
            .await
            .and_then(|r| r.error_for_status())
            .map_err(|_| "Could not download the voice model. Check your internet connection.".to_string())?;
        let total = res.content_length().unwrap_or(0);
        let part = dest.with_extension("part");
        let mut out = tokio::fs::File::create(&part).await.map_err(|e| e.to_string())?;
        let mut loaded = 0u64;
        let mut last_emit = 0u64;
        let mut stream = res.bytes_stream();
        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|_| "The voice download was interrupted. Try again.".to_string())?;
            out.write_all(&chunk).await.map_err(|e| e.to_string())?;
            loaded += chunk.len() as u64;
            if loaded - last_emit > 2_000_000 || loaded == total {
                last_emit = loaded;
                let frac = if total > 0 { loaded as f64 / total as f64 } else { 0.0 };
                let _ = app.emit(
                    "voice://download",
                    Progress { file: file.to_string(), loaded, total, overall: (i as f64 + frac) / n },
                );
            }
        }
        out.flush().await.map_err(|e| e.to_string())?;
        drop(out);
        if total > 0 && loaded != total {
            let _ = tokio::fs::remove_file(&part).await;
            return Err("The voice download was incomplete. Try again.".into());
        }
        tokio::fs::rename(&part, &dest).await.map_err(|e| e.to_string())?;
    }
    let _ = app.emit("voice://download", Progress { file: String::new(), loaded: 1, total: 1, overall: 1.0 });
    Ok(())
}

/// Resolves a request path inside the model root, refusing anything that escapes it.
pub fn safe_join(root: &Path, url_path: &str) -> Option<PathBuf> {
    let rel = url_path.trim_start_matches('/');
    let rel = rel.split('?').next().unwrap_or_default();
    let decoded = rel.replace("%2F", "/");
    let mut out = root.to_path_buf();
    for part in Path::new(&decoded).components() {
        match part {
            Component::Normal(p) => out.push(p),
            _ => return None,
        }
    }
    Some(out)
}

/// Handler for `pbmodel://localhost/<model id>/<file>`.
pub fn protocol<R: Runtime>(ctx: UriSchemeContext<'_, R>, req: Request<Vec<u8>>) -> Response<Vec<u8>> {
    let respond = |status: StatusCode, body: Vec<u8>, ctype: &str| {
        Response::builder()
            .status(status)
            .header("Content-Type", ctype)
            .header("Access-Control-Allow-Origin", "*")
            .header("Cross-Origin-Resource-Policy", "cross-origin")
            .body(body)
            .unwrap_or_default()
    };
    let Ok(root) = ctx.app_handle().path().app_data_dir().map(|d| d.join("voice-models")) else {
        return respond(StatusCode::INTERNAL_SERVER_ERROR, vec![], "text/plain");
    };
    let Some(path) = safe_join(&root, req.uri().path()) else {
        return respond(StatusCode::FORBIDDEN, vec![], "text/plain");
    };
    match std::fs::read(&path) {
        Ok(bytes) => {
            let ctype = if path.extension().is_some_and(|e| e == "json") { "application/json" } else { "application/octet-stream" };
            respond(StatusCode::OK, bytes, ctype)
        }
        Err(_) => respond(StatusCode::NOT_FOUND, vec![], "text/plain"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn paths_cannot_escape_the_model_folder() {
        let root = Path::new("/data/voice-models");
        assert_eq!(
            safe_join(root, "/onnx-community/Kokoro-82M-v1.0-ONNX/config.json").unwrap(),
            root.join("onnx-community").join("Kokoro-82M-v1.0-ONNX").join("config.json")
        );
        assert!(safe_join(root, "/../secrets.txt").is_none());
        assert!(safe_join(root, "/a/../../b").is_none());
    }

    #[test]
    fn variants_include_tokenizer_and_model() {
        assert!(files_for("q8").unwrap().contains(&"onnx/model_quantized.onnx"));
        assert!(files_for("fp32").unwrap().contains(&"tokenizer.json"));
        assert!(files_for("nope").is_none());
    }
}
