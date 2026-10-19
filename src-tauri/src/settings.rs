use crate::db::Db;
use serde::{Deserialize, Serialize};

pub const ACTIONS: &[&str] = &[
    "none", "happy", "dance", "feed", "play", "angry", "sleep", "celebrate", "wave", "joke", "sing", "trick", "tickle",
    "sneeze", "scared", "backflip", "moonwalk", "juggle", "magic", "karate", "flex", "shades", "meditate", "airguitar",
    "cartwheel", "selfie", "yoyo", "evolve", "confetti",
];

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(default, rename_all = "camelCase")]
pub struct Settings {
    pub onboarded: bool,
    pub theme: String,
    pub scale: f64,
    pub opacity: f64,
    pub animation_speed: f64,
    pub walk_speed: f64,
    pub fps: u32,
    pub performance_mode: bool,
    pub pause_when_fullscreen: bool,
    pub sleep_when_idle: bool,
    pub idle_minutes: u32,
    pub notifications: bool,
    pub walking: bool,
    pub gravity: bool,
    pub mouse_interaction: bool,
    pub click_through: bool,
    pub launch_at_startup: bool,
    pub pets_hidden: bool,
    pub animations_paused: bool,
    pub overlay_enabled: bool,
    pub overlay_port: u16,
    pub overlay_scale: f64,
    pub twitch_client_id: String,
    pub twitch_follow_action: String,
    pub twitch_sub_action: String,
    pub twitch_gift_action: String,
    pub twitch_cheer_action: String,
    pub twitch_raid_action: String,
    pub art_style: String,
    pub chattiness: String,
    pub voice_mode: String,
    pub voice_volume: f64,
    pub sound_effects: bool,
    pub user_name: String,
    /// Harmless mischief: fake cursor theft, tantrums when ignored, jealousy. Off by default.
    pub naughty_mode: bool,
    /// Opt-in: react to the kind of app in front (see activity.rs for what is and isn't read).
    pub activity_awareness: bool,
    /// Pets may mention the Spotify song that is playing.
    pub activity_song_names: bool,
    /// App keys (e.g. "discord") pets never react to.
    pub activity_ignore: Vec<String>,
    /// Quiet pets during video calls.
    pub meeting_mode: bool,
    /// Pets can jump onto and ride the active window (Windows).
    pub perch_windows: bool,
    pub break_reminders: bool,
    pub water_reminders: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            onboarded: false,
            theme: "system".into(),
            scale: 3.0,
            opacity: 1.0,
            animation_speed: 1.0,
            walk_speed: 1.0,
            fps: 24,
            performance_mode: false,
            pause_when_fullscreen: true,
            sleep_when_idle: true,
            idle_minutes: 5,
            notifications: true,
            walking: true,
            gravity: true,
            mouse_interaction: true,
            click_through: true,
            launch_at_startup: false,
            pets_hidden: false,
            animations_paused: false,
            overlay_enabled: true,
            overlay_port: 47823,
            overlay_scale: 4.0,
            twitch_client_id: option_env!("PIXELBUDDY_TWITCH_CLIENT_ID").unwrap_or_default().to_string(),
            twitch_follow_action: "happy".into(),
            twitch_sub_action: "evolve".into(),
            twitch_gift_action: "confetti".into(),
            twitch_cheer_action: "feed".into(),
            twitch_raid_action: "celebrate".into(),
            art_style: "hd".into(),
            chattiness: "normal".into(),
            voice_mode: "babble".into(),
            voice_volume: 0.6,
            sound_effects: true,
            user_name: String::new(),
            naughty_mode: false,
            activity_awareness: false,
            activity_song_names: true,
            activity_ignore: Vec::new(),
            meeting_mode: true,
            perch_windows: false,
            break_reminders: false,
            water_reminders: false,
        }
    }
}

fn action_or(v: &str, fallback: &str) -> String {
    if ACTIONS.contains(&v) {
        v.to_string()
    } else {
        fallback.to_string()
    }
}

impl Settings {
    /// Clamps every value into its supported range so a bad write can never break rendering.
    pub fn sanitized(mut self) -> Self {
        let d = Settings::default();
        if !["system", "light", "dark"].contains(&self.theme.as_str()) {
            self.theme = d.theme.clone();
        }
        self.scale = self.scale.clamp(1.0, 8.0).round();
        self.opacity = self.opacity.clamp(0.2, 1.0);
        self.animation_speed = self.animation_speed.clamp(0.25, 3.0);
        self.walk_speed = self.walk_speed.clamp(0.25, 3.0);
        self.fps = self.fps.clamp(5, 60);
        self.idle_minutes = self.idle_minutes.clamp(1, 120);
        if self.overlay_port < 1024 {
            self.overlay_port = d.overlay_port;
        }
        self.overlay_scale = self.overlay_scale.clamp(1.0, 10.0).round();
        self.twitch_client_id = self
            .twitch_client_id
            .chars()
            .filter(|c| c.is_ascii_alphanumeric())
            .take(64)
            .collect();
        self.twitch_follow_action = action_or(&self.twitch_follow_action, &d.twitch_follow_action);
        self.twitch_sub_action = action_or(&self.twitch_sub_action, &d.twitch_sub_action);
        self.twitch_gift_action = action_or(&self.twitch_gift_action, &d.twitch_gift_action);
        self.twitch_cheer_action = action_or(&self.twitch_cheer_action, &d.twitch_cheer_action);
        self.twitch_raid_action = action_or(&self.twitch_raid_action, &d.twitch_raid_action);
        if !["pixel", "hd"].contains(&self.art_style.as_str()) {
            self.art_style = d.art_style.clone();
        }
        if !["off", "rare", "normal", "chatty"].contains(&self.chattiness.as_str()) {
            self.chattiness = d.chattiness.clone();
        }
        if !["off", "babble", "speech", "natural"].contains(&self.voice_mode.as_str()) {
            self.voice_mode = d.voice_mode.clone();
        }
        self.voice_volume = self.voice_volume.clamp(0.0, 1.0);
        self.user_name = self.user_name.chars().filter(|c| !c.is_control()).take(24).collect::<String>().trim().to_string();
        let mut ignore: Vec<String> = self
            .activity_ignore
            .iter()
            .map(|a| crate::activity::app_key(a).chars().filter(|c| !c.is_control()).take(64).collect::<String>())
            .filter(|a| !a.is_empty())
            .collect();
        ignore.sort();
        ignore.dedup();
        ignore.truncate(50);
        self.activity_ignore = ignore;
        self
    }

    /// Frames per second the pet windows should actually run at.
    pub fn effective_fps(&self) -> u32 {
        if self.performance_mode {
            self.fps.min(12)
        } else {
            self.fps
        }
    }

    pub fn load(db: &Db) -> Self {
        db.kv_get("settings")
            .ok()
            .flatten()
            .and_then(|s| serde_json::from_str::<Settings>(&s).ok())
            .unwrap_or_default()
            .sanitized()
    }

    pub fn save(&self, db: &Db) -> rusqlite::Result<()> {
        db.kv_set("settings", &serde_json::to_string(self).expect("settings serialize"))
    }

    /// Applies a partial JSON patch from the UI. Unknown keys are ignored.
    pub fn patched(&self, patch: &serde_json::Value) -> Self {
        let mut v = serde_json::to_value(self).expect("settings serialize");
        if let (Some(obj), Some(p)) = (v.as_object_mut(), patch.as_object()) {
            for (k, val) in p {
                if obj.contains_key(k) {
                    obj.insert(k.clone(), val.clone());
                }
            }
        }
        serde_json::from_value::<Settings>(v).unwrap_or_else(|_| self.clone()).sanitized()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn defaults_survive_roundtrip() {
        let db = Db::open_in_memory().unwrap();
        assert_eq!(Settings::load(&db), Settings::default().sanitized());
        let s = Settings { scale: 5.0, ..Settings::default() };
        s.save(&db).unwrap();
        assert_eq!(Settings::load(&db).scale, 5.0);
    }

    #[test]
    fn patch_clamps_and_ignores_unknown() {
        let s = Settings::default().patched(&json!({"scale": 99, "fps": 1, "opacity": 0, "nope": true, "theme": "neon"}));
        assert_eq!(s.scale, 8.0);
        assert_eq!(s.fps, 5);
        assert_eq!(s.opacity, 0.2);
        assert_eq!(s.theme, "system");
    }

    #[test]
    fn wrong_types_keep_previous_values() {
        let s = Settings::default().patched(&json!({"scale": "big"}));
        assert_eq!(s.scale, 3.0);
    }

    #[test]
    fn performance_mode_caps_fps() {
        let s = Settings { fps: 60, performance_mode: true, ..Settings::default() };
        assert_eq!(s.effective_fps(), 12);
    }

    #[test]
    fn missing_fields_use_defaults() {
        let s: Settings = serde_json::from_str(r#"{"scale": 2}"#).unwrap();
        assert_eq!(s.scale, 2.0);
        assert_eq!(s.fps, 24);
    }
}
