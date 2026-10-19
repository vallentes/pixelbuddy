# Security and performance review

Scope: desktop app (Rust core, webviews), OBS overlay server, Twitch integration, voice model download. Version 1.0.0. Licensing was removed; the app is free and links to donation pages.

## Security

| Area | Control |
| --- | --- |
| Webview | Strict CSP: `default-src 'self'`, no inline scripts, `'wasm-unsafe-eval'` only for the voice engine, `object-src 'none'`, `frame-ancestors 'none'`. Network access limited to IPC, the local model protocol and Hugging Face (model files only). |
| Cross-origin isolation | COOP/COEP headers enable multi-threaded WebAssembly; nothing cross-origin can be embedded without opting in. |
| Capabilities | Pet windows get only the window operations they use (position, size, drag, ignore-cursor, show/hide, menu). No shell or filesystem permissions in any webview. |
| External links | Opened from Rust only. The donation URL is a constant (`open_support_link` takes no argument), so a compromised page cannot open arbitrary URLs through it. |
| Input validation | Species, colors, accessories and actions come from allowlists; names and labels are trimmed and length-limited; settings are clamped; positions must be finite; SQL is parameterized. |
| Twitch | OAuth device-code flow (public client, no secret). Tokens live in the OS keychain and Rust memory only; never sent to a webview or logged (`Secret` redacts `Debug`). Viewer names are rendered as canvas text, never HTML. |
| Overlay server | Loopback only, Host header check (blocks DNS rebinding), no CORS in release builds, serves only pet names and cosmetics. |
| Voice model | Downloaded over HTTPS from the official Hugging Face repo into the app data folder, written via a `.part` file and size-checked. Served through `pbmodel://` with a path-traversal guard (unit tested). Runtime files ship inside the app; no remote scripts. |
| Donation details | The Revolut IBAN/BIC shown on the Support screen are hard-coded and only copied to the clipboard on request. |

## Performance

| Area | Measure |
| --- | --- |
| Rendering | HD rig at 60 fps (12 in performance mode); pixel sheets prebuilt once. One rAF loop per pet, stopped entirely when paused, hidden or behind a fullscreen app. |
| Idle | Sleeping pets drop to 4 fps while you are away. |
| Cursor polling | 80 ms (200 ms in performance mode), skipped while hidden or dragged. |
| Pet-to-pet | Presence broadcast every 300 ms; interaction checks every 5 s. |
| Voice | WebGPU when available (about 1 s per line after a 5 s warm-up on an RTX GPU), multi-threaded CPU otherwise. Generated lines are cached; common lines are pre-generated in the background one at a time. |
| Binary | Release profile: LTO, `opt-level = "s"`, stripped. |

## Known limitations

1. macOS has not been built or run yet; build and smoke-test on a Mac before publishing there.
2. Installers are unsigned until a code-signing certificate is added (Windows SmartScreen will warn).
3. CPU-only machines generate natural voice slower than real time; the bubble waits up to 6 s, then shows text without voice.
4. The natural voice model is about 330 MB on GPU machines (90 MB on CPU).
