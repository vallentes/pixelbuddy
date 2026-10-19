# PixelBuddy

Free desktop pets for Windows and macOS. Five original characters walk along your taskbar, talk, tell jokes, do tricks, react when you poke them, and play with each other. Streamers get an OBS overlay and optional Twitch reactions.

PixelBuddy is free, with no ads and no tracking. Donations are welcome:

* ☕ Buy Me a Coffee: https://buymeacoffee.com/vallentes
* Bank transfer (Revolut, RON): Valentin Vina, IBAN `RO28 REVO 0000 1988 0630 1331`, BIC `REVOROBB`

Both are also on the app's **Support** screen, on the sidebar coffee button and in the tray menu.

## Tech

* Tauri 2 + Rust core, React + TypeScript settings UI, canvas renderers (HD vector rig and pixel art)
* SQLite (bundled) for pets and settings; OS keychain for Twitch tokens
* Natural voices: Kokoro-82M (Apache-2.0), run locally with ONNX Runtime (WebGPU, or multi-threaded CPU as fallback)
* Font: Fredoka (SIL Open Font License), bundled

See [ARCHITECTURE.md](ARCHITECTURE.md) and [SECURITY_PERFORMANCE_REVIEW.md](SECURITY_PERFORMANCE_REVIEW.md).

## Layout

| Path | What |
| --- | --- |
| `src-tauri/` | Rust core: pets, settings, windows, tray, overlay server, Twitch, voice model download |
| `src/settings/` | React settings app, plus the natural-voice service (runs in the main window) |
| `src/pet/` | Pet window: rendering, movement, touch, drag/throw, talking, pet-to-pet social layer |
| `src/hd/` | HD vector characters: pose rig, drawing, props, particles |
| `src/sprites/` | Pixel-art characters (procedural, original) |
| `src/engine/` | Behavior brain, chatter and jokes, social scripts, motion (pure, unit tested) |
| `src/overlay/` | OBS overlay page served by the app on 127.0.0.1 |

## Develop

Requirements: Node 20+, Rust stable, and on Windows the Visual Studio 2022 Build Tools with "Desktop development with C++" (WebView2 ships with Windows 11). On macOS: Xcode command line tools.

```bash
npm install
```

```bash
npm run tauri dev
```

```bash
npm test
```

```bash
cargo test --workspace
```

A bare `cargo build` produces a dev-mode binary that loads `http://localhost:1420`; use `npm run tauri build`, or add `--features tauri/custom-protocol` for a debug binary with the bundled pages.

The dev-only art gallery (`gallery.html`, all characters and tricks, plus a voice test) runs with `npm run dev`; open `http://localhost:1420/gallery.html`.

## Twitch (optional)

Create a **Public** application at https://dev.twitch.tv/console/apps, then either build with `PIXELBUDDY_TWITCH_CLIENT_ID=...` or paste the Client ID in Settings, Streaming. Login uses Twitch's device-code flow; no secret is shipped.

## OBS overlay

Settings, Streaming shows the URL (default `http://127.0.0.1:47823/overlay`). Add it as a Browser Source (for example 1920x300). Works without Twitch.

## Release

* **Windows:** `npm run tauri build` makes `target/release/bundle/nsis/PixelBuddy_<v>_x64-setup.exe` (per-user) and `msi/PixelBuddy_<v>_x64_en-US.msi`. Sign by setting `bundle.windows.certificateThumbprint` to your code-signing certificate.
* **macOS:** on a Mac, `npm run tauri build -- --target universal-apple-darwin`, with `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` set to sign and notarize.

Bump the version in `package.json`, `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json` first. `.github/workflows/release.yml` builds both platforms on a `v*` tag if the repo is hosted on GitHub.

## Data

* Windows: `%APPDATA%\app.pixelbuddy.desktop\` (database `pixelbuddy.db`, voice model in `voice-models\`), logs in `%LOCALAPPDATA%\app.pixelbuddy.desktop\logs`
* macOS: `~/Library/Application Support/app.pixelbuddy.desktop/`
* Keychain (service `app.pixelbuddy.desktop`): `twitch_tokens` only when Twitch is connected
