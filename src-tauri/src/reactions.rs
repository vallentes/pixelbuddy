//! In-process event bus. Reactions (feed, dance, Twitch follows...) fan out to pet windows via
//! Tauri events and to the OBS overlay via a broadcast channel.

use serde::Serialize;
use tauri::{AppHandle, Emitter};
use tokio::sync::broadcast;

pub const ACTIONS: &[&str] = &[
    "feed", "play", "pat", "happy", "dance", "angry", "sleep", "wake", "celebrate", "wave", "joke", "sing", "trick", "tickle",
    "yawn", "sneeze", "scared", "sit", "backflip", "moonwalk", "juggle", "magic", "karate", "flex", "peekaboo",
    "shades", "trip", "hiccup", "meditate", "toot", "stretch", "airguitar", "bubblegum", "cartwheel", "tiptoe", "yoyo",
    "selfie", "evolve", "confetti",
];

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Reaction {
    pub action: String,
    /// `None` targets every pet.
    pub pet_id: Option<i64>,
    pub source: String,
    /// Short text shown in a speech bubble ("New follower: ...").
    pub label: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum BusEvent {
    Reaction(Reaction),
    /// Pets or overlay-relevant settings changed; overlay should reload state.
    StateChanged,
}

pub struct Bus {
    tx: broadcast::Sender<BusEvent>,
}

impl Default for Bus {
    fn default() -> Self {
        let (tx, _) = broadcast::channel(64);
        Self { tx }
    }
}

impl Bus {
    pub fn subscribe(&self) -> broadcast::Receiver<BusEvent> {
        self.tx.subscribe()
    }

    pub fn state_changed(&self) {
        let _ = self.tx.send(BusEvent::StateChanged);
    }

    pub fn react(&self, app: &AppHandle, r: Reaction) {
        let _ = app.emit("pet://reaction", &r);
        let _ = self.tx.send(BusEvent::Reaction(r));
    }
}

/// Trims user-provided label text (e.g. Twitch display names) to something safe to render.
pub fn clean_label(s: &str) -> String {
    s.chars().filter(|c| !c.is_control()).take(40).collect::<String>().trim().to_string()
}
