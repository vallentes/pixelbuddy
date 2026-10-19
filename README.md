# PixelBuddy

Free desktop pets for Windows and macOS. Fifteen original characters (a cat, frog, dragon, robot, cloud-sheep, penguin, bunny, puppy, owl, hamster, alien, ghost, turtle, octopus and panda) walk along your taskbar, talk, tell jokes, do 19 tricks, react when you poke them, and play with each other. Streamers get an OBS overlay and optional Twitch reactions.

**[⬇ Download the latest release](https://github.com/vallentes/pixelbuddy/releases/latest)** · [How to install](#install)

## Support PixelBuddy

PixelBuddy is free, with no ads and no tracking. If it made you smile, tips are very welcome:

<table>
<tr>
<td align="center" width="50%">

### ☕ Buy Me a Coffee

**[buymeacoffee.com/vallentes](https://buymeacoffee.com/vallentes)**

</td>
<td align="center" width="50%">

### Revolut

**[revolut.me/vallentes](https://revolut.me/vallentes)** · `@vallentes`

<a href="https://revolut.me/vallentes"><img src="docs/revolut-qr.svg" width="160" alt="QR code for revolut.me/vallentes"></a>

Scan or click. Pay with Revolut, any card or Apple Pay. No Revolut account needed.

</td>
</tr>
</table>

<details>
<summary>Prefer a bank transfer?</summary>

Valentin Vina · IBAN `RO28 REVO 0000 1988 0630 1331` · BIC `REVOROBB` · RON

</details>

The same links are in the app: **Support** screen, the sidebar coffee button and the tray menu.

## Install

### Windows 10 / 11

1. Go to [Releases](https://github.com/vallentes/pixelbuddy/releases/latest) and download **`PixelBuddy_x.y.z_x64-setup.exe`**.
2. Run it. Windows may show **"Windows protected your PC"** because the installer is not code-signed yet: click **More info → Run anyway**.
3. It installs for your user only (no admin needed) and starts PixelBuddy. Pick your first pet and give it a name.
4. PixelBuddy lives in the **system tray** (bottom right, near the clock; click the `^` arrow if you don't see it). Click the icon to open Settings, right-click it for quick actions.

Uninstall from **Settings → Apps → Installed apps → PixelBuddy**. Your pets are kept in `%APPDATA%\app.pixelbuddy.desktop` if you reinstall later.

The **`.msi`** file is the same app for IT / managed installs (e.g. `msiexec /i PixelBuddy_x.y.z_x64_en-US.msi /qn`).

### macOS 11 or newer (Apple Silicon and Intel)

1. Download **`PixelBuddy_x.y.z_universal.dmg`** from [Releases](https://github.com/vallentes/pixelbuddy/releases/latest).
2. Open the `.dmg` and drag **PixelBuddy** into **Applications**.
3. The app is not notarized by Apple yet, so the first launch needs one extra step: open **Applications**, **right-click PixelBuddy → Open**, then click **Open** again. (On macOS 15+: try to open it once, then go to **System Settings → Privacy & Security**, scroll down and click **Open Anyway**.)
4. PixelBuddy appears in the **menu bar** at the top right. Allow notifications if you want hunger reminders.

Uninstall by dragging PixelBuddy from Applications to the Trash.

### First steps

* **Talk:** Settings → Personality → Voice → *Natural voices* (one-time download, runs offline after that). Add your name so your pets greet you.
* **Play:** right-click a pet for food, games and **Tricks**. Boop its nose, tickle its belly, pull its tail, press and hold to hug, or throw it across the screen.
* **Friends:** adopt a second pet (Settings → Pets) and they'll start chatting, playing tag and pranking each other.
* **Streaming:** Settings → Streaming gives you an OBS overlay URL.

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

## License

Copyright (c) 2026 Valentin Vina (Vallentes). All rights reserved. The official builds are free to download and use; see [LICENSE](LICENSE).
