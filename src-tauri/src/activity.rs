//! "React to what I'm doing" (opt-in, off by default).
//!
//! Privacy by design:
//! * Only the active app's name and window title are looked at, in memory, a few times a second.
//!   Nothing is stored on disk, logged or sent anywhere.
//! * The title never leaves this module: pets only receive a category ("video", "mail"...), a
//!   friendly label from our own rule table ("YouTube") and, for music players when the user
//!   allows it, the "Artist - Song" text.
//! * Private/incognito windows, password managers, banking and anything on the user's ignore list
//!   are reported as "private" and get no reaction.
//! * Typing activity is a count of moments with input but no mouse movement. Which keys were
//!   pressed is never read.
//! * Screen contents are never captured.

use crate::state;
use serde::Serialize;
use std::sync::atomic::{AtomicI64, Ordering};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

/// Unix ms until which peeking is paused from the tray.
static PAUSED_UNTIL: AtomicI64 = AtomicI64::new(0);

pub fn pause_for(minutes: i64) {
    PAUSED_UNTIL.store(crate::now() + minutes * 60_000, Ordering::Relaxed);
}

pub fn resume() {
    PAUSED_UNTIL.store(0, Ordering::Relaxed);
}

pub fn paused() -> bool {
    PAUSED_UNTIL.load(Ordering::Relaxed) > crate::now()
}

#[derive(Debug, Clone, Default, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Activity {
    /// off | paused | private | video | music | meeting | chat | mail | code | game | social |
    /// shopping | docs | browse | other
    pub kind: &'static str,
    /// Friendly name from our rule table, never the raw title.
    pub label: Option<&'static str>,
    /// "Artist - Song" for music players, only with song names allowed.
    pub detail: Option<String>,
    /// 0 calm .. 3 typing like crazy.
    pub typing: u8,
    /// Active window rectangle (physical px: x, y, width, height) for pets to climb on.
    pub window: Option<[i32; 4]>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Class {
    pub kind: &'static str,
    pub label: Option<&'static str>,
    pub detail: Option<String>,
}

struct Rule {
    kind: &'static str,
    label: &'static str,
    apps: &'static [&'static str],
    titles: &'static [&'static str],
}

const PRIVATE_TITLES: &[&str] = &[
    "inprivate", "incognito", "private browsing", "private window", "- private", "password", "bank", "banking",
    "paypal", "tax return", "medical", "health record",
];
const PRIVATE_APPS: &[&str] = &[
    "1password", "bitwarden", "keepass", "keepassxc", "lastpass", "dashlane", "enpass", "keychain access", "passwords",
    "credentialuibroker", "consent", "logonui",
];
const BROWSERS: &[&str] = &[
    "chrome", "msedge", "firefox", "brave", "opera", "opera_gx", "vivaldi", "arc", "safari", "google chrome",
    "microsoft edge", "zen", "librewolf", "waterfox", "chromium",
];

/// Checked in order; the first match wins (so "youtube music" is music, not video).
const RULES: &[Rule] = &[
    Rule { kind: "meeting", label: "Zoom", apps: &["zoom", "zoom.us", "cpthost"], titles: &["zoom meeting", "zoom webinar"] },
    Rule { kind: "meeting", label: "Teams", apps: &[], titles: &["| microsoft teams meeting", "meeting in \"", "(meeting) | microsoft teams", "call | microsoft teams", "| call |"] },
    Rule { kind: "meeting", label: "Google Meet", apps: &[], titles: &["meet - ", "google meet"] },
    Rule { kind: "meeting", label: "Webex", apps: &["webex", "ciscocollabhost", "atmgr"], titles: &["webex meeting"] },
    Rule { kind: "meeting", label: "a huddle", apps: &[], titles: &["huddle"] },
    Rule { kind: "music", label: "Spotify", apps: &["spotify"], titles: &[] },
    Rule { kind: "music", label: "YouTube Music", apps: &[], titles: &["youtube music"] },
    Rule { kind: "music", label: "SoundCloud", apps: &[], titles: &["soundcloud"] },
    Rule { kind: "music", label: "Apple Music", apps: &["music", "itunes"], titles: &[] },
    Rule { kind: "music", label: "music", apps: &["foobar2000", "winamp", "aimp", "tidal", "deezer", "musicbee", "vox"], titles: &["deezer", "tidal"] },
    Rule { kind: "video", label: "YouTube", apps: &[], titles: &["youtube"] },
    Rule { kind: "video", label: "Netflix", apps: &["netflix"], titles: &["netflix"] },
    Rule { kind: "video", label: "Twitch", apps: &[], titles: &["- twitch", "twitch.tv"] },
    Rule { kind: "video", label: "Prime Video", apps: &[], titles: &["prime video"] },
    Rule { kind: "video", label: "Disney+", apps: &[], titles: &["disney+"] },
    Rule { kind: "video", label: "a movie", apps: &["vlc", "mpc-hc64", "mpc-hc", "mpv", "potplayermini64", "potplayer", "iina", "quicktime player", "video.ui", "infuse"], titles: &["vimeo", "crunchyroll", "hbo max", "plex", "jellyfin"] },
    Rule { kind: "chat", label: "Discord", apps: &["discord"], titles: &["- discord"] },
    Rule { kind: "chat", label: "Slack", apps: &["slack"], titles: &["| slack"] },
    Rule { kind: "chat", label: "Teams", apps: &["ms-teams", "teams", "microsoft teams"], titles: &["microsoft teams"] },
    Rule { kind: "chat", label: "WhatsApp", apps: &["whatsapp"], titles: &["whatsapp"] },
    Rule { kind: "chat", label: "Telegram", apps: &["telegram"], titles: &["telegram web"] },
    Rule { kind: "chat", label: "Messenger", apps: &["messenger", "messages", "signal", "viber", "wechat", "skype"], titles: &["messenger"] },
    Rule { kind: "mail", label: "Outlook", apps: &["outlook", "olk", "hxoutlook", "microsoft outlook"], titles: &["- outlook", "outlook.com"] },
    Rule { kind: "mail", label: "Gmail", apps: &[], titles: &["gmail", "- inbox"] },
    Rule { kind: "mail", label: "email", apps: &["thunderbird", "mail", "spark", "mailbird", "em client"], titles: &["proton mail", "yahoo mail"] },
    Rule { kind: "code", label: "code", apps: &["code", "code - insiders", "cursor", "devenv", "idea64", "pycharm64", "webstorm64", "rider64", "clion64", "goland64", "studio64", "sublime_text", "notepad++", "zed", "xcode", "android studio", "intellij idea", "windsurf"], titles: &["visual studio code"] },
    Rule { kind: "code", label: "the terminal", apps: &["windowsterminal", "wt", "powershell", "cmd", "terminal", "iterm2", "warp", "alacritty", "wezterm-gui"], titles: &[] },
    Rule { kind: "game", label: "a game", apps: &["steam", "steamwebhelper", "epicgameslauncher", "battle.net", "riotclientux", "gog galaxy", "minecraft", "javaw", "robloxplayerbeta"], titles: &["minecraft", "roblox"] },
    Rule { kind: "social", label: "Reddit", apps: &[], titles: &["reddit"] },
    Rule { kind: "social", label: "X", apps: &[], titles: &["/ x", "on x:", "twitter"] },
    Rule { kind: "social", label: "Instagram", apps: &["instagram"], titles: &["instagram"] },
    Rule { kind: "social", label: "TikTok", apps: &["tiktok"], titles: &["tiktok"] },
    Rule { kind: "social", label: "Facebook", apps: &["facebook"], titles: &["facebook"] },
    Rule { kind: "social", label: "LinkedIn", apps: &[], titles: &["linkedin"] },
    Rule { kind: "social", label: "Bluesky", apps: &[], titles: &["bluesky"] },
    Rule { kind: "shopping", label: "Amazon", apps: &[], titles: &["amazon.", "amazon -", ": amazon"] },
    Rule { kind: "shopping", label: "shopping", apps: &[], titles: &["ebay", "aliexpress", "etsy", "temu", "emag", "shopping cart", "your cart", "checkout"] },
    Rule { kind: "docs", label: "Word", apps: &["winword", "microsoft word", "pages"], titles: &["google docs"] },
    Rule { kind: "docs", label: "Excel", apps: &["excel", "microsoft excel", "numbers"], titles: &["google sheets"] },
    Rule { kind: "docs", label: "PowerPoint", apps: &["powerpnt", "microsoft powerpoint", "keynote"], titles: &["google slides"] },
    Rule { kind: "docs", label: "notes", apps: &["onenote", "notion", "obsidian", "notes", "evernote"], titles: &[] },
];

/// Lowercase file stem of an executable path or app name ("C:\\x\\Discord.exe" -> "discord").
pub fn app_key(app: &str) -> String {
    let name = app.rsplit(['\\', '/']).next().unwrap_or(app).to_lowercase();
    name.strip_suffix(".exe").or_else(|| name.strip_suffix(".app")).unwrap_or(&name).trim().to_string()
}

/// Sorts the active window into a category. `ignore` holds app keys the user excluded.
pub fn classify(app: &str, title: &str, ignore: &[String], song_names: bool) -> Class {
    let key = app_key(app);
    let t = title.to_lowercase();
    let private = Class { kind: "private", label: None, detail: None };
    if key.is_empty() || ignore.iter().any(|i| *i == key) {
        return private;
    }
    if PRIVATE_APPS.contains(&key.as_str()) || PRIVATE_TITLES.iter().any(|p| t.contains(p)) {
        return private;
    }
    for r in RULES {
        if r.apps.contains(&key.as_str()) || r.titles.iter().any(|p| t.contains(p)) {
            let detail = if r.kind == "music" && key == "spotify" && song_names { song_from_spotify(title) } else { None };
            return Class { kind: r.kind, label: Some(r.label), detail };
        }
    }
    if BROWSERS.contains(&key.as_str()) {
        return Class { kind: "browse", label: None, detail: None };
    }
    Class { kind: "other", label: None, detail: None }
}

/// Spotify's window title is "Artist - Song" while playing and "Spotify ..." when paused.
fn song_from_spotify(title: &str) -> Option<String> {
    let t = title.trim();
    if t.is_empty() || t.to_lowercase().starts_with("spotify") || !t.contains(" - ") {
        return None;
    }
    Some(t.chars().filter(|c| !c.is_control()).take(80).collect())
}

/// Turns "typing moments in the last 10 s" into a 0-3 level.
pub fn typing_level(moments: usize) -> u8 {
    match moments {
        0..=3 => 0,
        4..=9 => 1,
        10..=17 => 2,
        _ => 3,
    }
}

/// Polls the active window while the feature is on and emits `activity://state` on changes.
pub fn spawn(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut last = Activity { kind: "off", ..Default::default() };
        let mut typed: std::collections::VecDeque<i64> = std::collections::VecDeque::new();
        let _ = app.emit("activity://state", &last);
        loop {
            let s = state(&app).settings.read().unwrap().clone();
            let aware = s.activity_awareness;
            let next = if !aware && !s.perch_windows {
                typed.clear();
                Activity { kind: "off", ..Default::default() }
            } else if paused() {
                typed.clear();
                Activity { kind: "paused", ..Default::default() }
            } else {
                let now = crate::now();
                if aware && crate::system::typed_since_last_sample() {
                    typed.push_back(now);
                }
                while typed.front().is_some_and(|t| now - *t > 10_000) {
                    typed.pop_front();
                }
                match crate::system::foreground() {
                    Some(fg) => {
                        let c = if aware {
                            classify(&fg.app, &fg.title, &s.activity_ignore, s.activity_song_names)
                        } else {
                            Class { kind: "off", label: None, detail: None }
                        };
                        Activity {
                            kind: c.kind,
                            label: c.label,
                            detail: c.detail,
                            typing: if aware { typing_level(typed.len()) } else { 0 },
                            window: if s.perch_windows && !fg.maximized { fg.rect } else { None },
                        }
                    }
                    // Our own window or the desktop is in front: keep what we had.
                    None => Activity { typing: if aware { typing_level(typed.len()) } else { 0 }, ..last.clone() },
                }
            };
            if next != last {
                let _ = app.emit("activity://state", &next);
                last = next;
            }
            let ms = if !aware && !s.perch_windows { 2000 } else { 300 };
            tokio::time::sleep(Duration::from_millis(ms)).await;
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    fn kind(app: &str, title: &str) -> &'static str {
        classify(app, title, &[], true).kind
    }

    #[test]
    fn sorts_common_apps() {
        assert_eq!(kind("C:\\Program Files\\Google\\Chrome\\chrome.exe", "Cute cats - YouTube - Google Chrome"), "video");
        assert_eq!(kind("chrome.exe", "Chill beats - YouTube Music"), "music");
        assert_eq!(kind("Discord.exe", "#general - Discord"), "chat");
        assert_eq!(kind("olk.exe", "Inbox - someone - Outlook"), "mail");
        assert_eq!(kind("Code.exe", "main.rs - pixelbuddy - Visual Studio Code"), "code");
        assert_eq!(kind("Zoom.exe", "Zoom Meeting"), "meeting");
        assert_eq!(kind("msedge.exe", "Meet - abc-defg-hij - Microsoft Edge"), "meeting");
        assert_eq!(kind("firefox.exe", "r/aww - Reddit - Mozilla Firefox"), "social");
        assert_eq!(kind("WINWORD.EXE", "Report.docx - Word"), "docs");
        assert_eq!(kind("firefox.exe", "Some random page - Mozilla Firefox"), "browse");
        assert_eq!(kind("explorer.exe", "Downloads"), "other");
    }

    #[test]
    fn private_things_stay_private() {
        assert_eq!(kind("msedge.exe", "New InPrivate tab - Microsoft Edge"), "private");
        assert_eq!(kind("chrome.exe", "YouTube - Google Chrome (Incognito)"), "private");
        assert_eq!(kind("1Password.exe", "1Password"), "private");
        assert_eq!(kind("chrome.exe", "My Bank - Accounts - Google Chrome"), "private");
        let ignore = vec!["discord".to_string()];
        assert_eq!(classify("Discord.exe", "#general - Discord", &ignore, true).kind, "private");
    }

    #[test]
    fn never_passes_on_the_title() {
        let c = classify("chrome.exe", "Secret project plans - YouTube", &[], true);
        assert_eq!(c.label, Some("YouTube"));
        assert_eq!(c.detail, None);
    }

    #[test]
    fn song_names_only_from_spotify_and_only_when_allowed() {
        assert_eq!(classify("Spotify.exe", "Daft Punk - One More Time", &[], true).detail.as_deref(), Some("Daft Punk - One More Time"));
        assert_eq!(classify("Spotify.exe", "Daft Punk - One More Time", &[], false).detail, None);
        assert_eq!(classify("Spotify.exe", "Spotify Premium", &[], true).detail, None);
    }

    #[test]
    fn typing_levels() {
        assert_eq!(typing_level(0), 0);
        assert_eq!(typing_level(5), 1);
        assert_eq!(typing_level(12), 2);
        assert_eq!(typing_level(30), 3);
    }

    #[test]
    fn app_keys() {
        assert_eq!(app_key("C:\\Apps\\Spotify.exe"), "spotify");
        assert_eq!(app_key("/Applications/Zoom.us.app"), "zoom.us");
        assert_eq!(app_key("Microsoft Outlook"), "microsoft outlook");
    }
}

#[cfg(test)]
mod live {
    /// Manual check on a real desktop: `cargo test live_foreground -- --ignored --nocapture`.
    /// Prints only the category, never the title.
    #[test]
    #[ignore]
    fn live_foreground() {
        let fg = crate::system::foreground().expect("a foreground window");
        let c = super::classify(&fg.app, &fg.title, &[], false);
        println!("kind={} label={:?} rect={:?} maximized={}", c.kind, c.label, fg.rect, fg.maximized);
        assert!(!fg.app.is_empty());
    }
}
