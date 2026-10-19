//! Pure mapping from EventSub notifications to pet reactions (unit tested).

use crate::reactions::{clean_label, Reaction};
use crate::settings::Settings;
use serde_json::Value;

/// Subscriptions we request. `(type, version, label)`.
pub const SUBSCRIPTIONS: &[(&str, &str, &str)] = &[
    ("channel.follow", "2", "Follows"),
    ("channel.subscribe", "1", "Subscriptions"),
    ("channel.subscription.gift", "1", "Gift subs"),
    ("channel.cheer", "1", "Cheers"),
    ("channel.raid", "1", "Raids"),
    ("channel.channel_points_custom_reward_redemption.add", "1", "Channel point rewards"),
];

pub fn condition(kind: &str, user_id: &str) -> Value {
    match kind {
        "channel.follow" => serde_json::json!({ "broadcaster_user_id": user_id, "moderator_user_id": user_id }),
        "channel.raid" => serde_json::json!({ "to_broadcaster_user_id": user_id }),
        _ => serde_json::json!({ "broadcaster_user_id": user_id }),
    }
}

fn name(ev: &Value, key: &str) -> String {
    ev.get(key).and_then(|v| v.as_str()).map(clean_label).filter(|s| !s.is_empty()).unwrap_or_else(|| "Someone".into())
}

fn reaction(action: &str, label: String, pet_id: Option<i64>) -> Option<Reaction> {
    if action == "none" || action.is_empty() {
        return None;
    }
    Some(Reaction { action: action.into(), pet_id, source: "twitch".into(), label: Some(label) })
}

/// `reward_action` looks up the configured `(action, pet_id)` for a reward id.
pub fn to_reaction(
    kind: &str,
    ev: &Value,
    s: &Settings,
    reward_action: impl Fn(&str) -> Option<(String, Option<i64>)>,
) -> Option<Reaction> {
    match kind {
        "channel.follow" => reaction(&s.twitch_follow_action, format!("{} followed!", name(ev, "user_name")), None),
        "channel.subscribe" => {
            if ev.get("is_gift").and_then(|v| v.as_bool()) == Some(true) {
                return None; // covered by the gift event
            }
            reaction(&s.twitch_sub_action, format!("{} subscribed!", name(ev, "user_name")), None)
        }
        "channel.subscription.gift" => {
            let who = if ev.get("is_anonymous").and_then(|v| v.as_bool()) == Some(true) {
                "Anonymous".to_string()
            } else {
                name(ev, "user_name")
            };
            let total = ev.get("total").and_then(|v| v.as_i64()).unwrap_or(1);
            reaction(&s.twitch_gift_action, format!("{who} gifted {total} sub{}!", if total == 1 { "" } else { "s" }), None)
        }
        "channel.cheer" => {
            let who = if ev.get("is_anonymous").and_then(|v| v.as_bool()) == Some(true) {
                "Anonymous".to_string()
            } else {
                name(ev, "user_name")
            };
            let bits = ev.get("bits").and_then(|v| v.as_i64()).unwrap_or(0);
            reaction(&s.twitch_cheer_action, format!("{who} cheered {bits}!"), None)
        }
        "channel.raid" => reaction(&s.twitch_raid_action, format!("Raid from {}!", name(ev, "from_broadcaster_user_name")), None),
        "channel.channel_points_custom_reward_redemption.add" => {
            let reward_id = ev.pointer("/reward/id").and_then(|v| v.as_str())?;
            let title = ev.pointer("/reward/title").and_then(|v| v.as_str()).map(clean_label).unwrap_or_default();
            let (action, pet) = reward_action(reward_id)?;
            reaction(&action, format!("{}: {title}", name(ev, "user_name")), pet)
        }
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn none(_: &str) -> Option<(String, Option<i64>)> {
        None
    }

    #[test]
    fn follow_uses_configured_action() {
        let s = Settings::default();
        let r = to_reaction("channel.follow", &json!({"user_name": "PixelFan"}), &s, none).unwrap();
        assert_eq!(r.action, "happy");
        assert_eq!(r.label.as_deref(), Some("PixelFan followed!"));
        assert_eq!(r.source, "twitch");
    }

    #[test]
    fn disabled_action_produces_nothing() {
        let s = Settings { twitch_follow_action: "none".into(), ..Settings::default() };
        assert!(to_reaction("channel.follow", &json!({"user_name": "x"}), &s, none).is_none());
    }

    #[test]
    fn gifted_sub_event_is_not_double_counted() {
        let s = Settings::default();
        assert!(to_reaction("channel.subscribe", &json!({"user_name": "a", "is_gift": true}), &s, none).is_none());
        let g = to_reaction("channel.subscription.gift", &json!({"user_name": "a", "total": 5}), &s, none).unwrap();
        assert_eq!(g.label.as_deref(), Some("a gifted 5 subs!"));
        let anon = to_reaction("channel.cheer", &json!({"user_name": null, "is_anonymous": true, "bits": 100}), &s, none).unwrap();
        assert_eq!(anon.label.as_deref(), Some("Anonymous cheered 100!"));
    }

    #[test]
    fn rewards_map_to_configured_pet_action() {
        let s = Settings::default();
        let ev = json!({"user_name": "Viewer", "reward": {"id": "r1", "title": "Feed the dragon"}});
        let r = to_reaction("channel.channel_points_custom_reward_redemption.add", &ev, &s, |id| {
            (id == "r1").then(|| ("feed".to_string(), Some(3)))
        })
        .unwrap();
        assert_eq!((r.action.as_str(), r.pet_id), ("feed", Some(3)));
        assert!(to_reaction("channel.channel_points_custom_reward_redemption.add", &json!({"reward": {"id": "zz"}}), &s, none).is_none());
    }

    #[test]
    fn labels_strip_control_characters() {
        let s = Settings::default();
        let r = to_reaction("channel.follow", &json!({"user_name": "bad\u{0007}\nname"}), &s, none).unwrap();
        assert_eq!(r.label.as_deref(), Some("badname followed!"));
    }
}
