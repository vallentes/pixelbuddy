use crate::db::Db;
use rusqlite::{params, Connection, OptionalExtension, Row};
use serde::{Deserialize, Serialize};

pub const SPECIES: &[&str] = &[
    "mochi", "pip", "ember", "bolt", "nimbus", "pickles", "clover", "waffles", "hoot", "biscuit", "zib", "boo", "shelly", "inky",
    "bao",
];
pub const COLORS: &[&str] = &["classic", "rose", "mint", "sky", "golden", "shadow"];
pub const ACCESSORIES: &[&str] = &["none", "bow", "tophat", "crown", "scarf", "glasses", "flower"];
pub const MAX_PETS: usize = 12;
pub const MAX_NAME_LEN: usize = 16;

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Pet {
    pub id: i64,
    pub species: String,
    pub name: String,
    pub color: String,
    pub accessory: String,
    pub visible: bool,
    pub monitor: Option<String>,
    pub pos_x: Option<f64>,
    pub pos_y: Option<f64>,
    pub hunger: f64,
    pub happiness: f64,
    pub energy: f64,
    pub created_at: i64,
    pub last_fed_at: Option<i64>,
    pub last_played_at: Option<i64>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PetPatch {
    pub name: Option<String>,
    pub color: Option<String>,
    pub accessory: Option<String>,
    pub visible: Option<bool>,
    pub monitor: Option<String>,
}

#[derive(Debug, thiserror::Error)]
pub enum PetError {
    #[error("unknown pet")]
    NotFound,
    #[error("{0}")]
    Invalid(String),
    #[error(transparent)]
    Db(#[from] rusqlite::Error),
}

fn from_row(r: &Row) -> rusqlite::Result<Pet> {
    Ok(Pet {
        id: r.get("id")?,
        species: r.get("species")?,
        name: r.get("name")?,
        color: r.get("color")?,
        accessory: r.get("accessory")?,
        visible: r.get("visible")?,
        monitor: r.get("monitor")?,
        pos_x: r.get("pos_x")?,
        pos_y: r.get("pos_y")?,
        hunger: r.get("hunger")?,
        happiness: r.get("happiness")?,
        energy: r.get("energy")?,
        created_at: r.get("created_at")?,
        last_fed_at: r.get("last_fed_at")?,
        last_played_at: r.get("last_played_at")?,
    })
}

pub fn clean_name(raw: &str) -> Result<String, PetError> {
    let name: String = raw.chars().filter(|c| !c.is_control()).collect();
    let name: String = name.trim().chars().take(MAX_NAME_LEN).collect::<String>().trim_end().to_string();
    if name.is_empty() {
        return Err(PetError::Invalid("Give your pet a name.".into()));
    }
    Ok(name)
}

pub fn list(db: &Db) -> Result<Vec<Pet>, PetError> {
    let c = db.conn();
    let mut st = c.prepare("SELECT * FROM pets ORDER BY sort_order, id")?;
    let rows = st.query_map([], from_row)?;
    Ok(rows.collect::<Result<_, _>>()?)
}

fn get_conn(c: &Connection, id: i64) -> Result<Pet, PetError> {
    c.query_row("SELECT * FROM pets WHERE id = ?1", [id], from_row).optional()?.ok_or(PetError::NotFound)
}

pub fn get(db: &Db, id: i64) -> Result<Pet, PetError> {
    get_conn(&db.conn(), id)
}

pub fn create(db: &Db, species: &str, name: &str, now: i64) -> Result<Pet, PetError> {
    if !SPECIES.contains(&species) {
        return Err(PetError::Invalid("Unknown species.".into()));
    }
    let name = clean_name(name)?;
    let c = db.conn();
    let count: i64 = c.query_row("SELECT COUNT(*) FROM pets", [], |r| r.get(0))?;
    if count as usize >= MAX_PETS {
        return Err(PetError::Invalid(format!("You can have up to {MAX_PETS} pets.")));
    }
    c.execute(
        "INSERT INTO pets (species, name, created_at, sort_order) VALUES (?1, ?2, ?3, ?4)",
        params![species, name, now, count],
    )?;
    get_conn(&c, c.last_insert_rowid())
}

pub fn update(db: &Db, id: i64, p: &PetPatch) -> Result<Pet, PetError> {
    let c = db.conn();
    let mut pet = get_conn(&c, id)?;
    if let Some(n) = &p.name {
        pet.name = clean_name(n)?;
    }
    if let Some(col) = &p.color {
        if !COLORS.contains(&col.as_str()) {
            return Err(PetError::Invalid("Unknown color.".into()));
        }
        pet.color = col.clone();
    }
    if let Some(a) = &p.accessory {
        if !ACCESSORIES.contains(&a.as_str()) {
            return Err(PetError::Invalid("Unknown accessory.".into()));
        }
        pet.accessory = a.clone();
    }
    if let Some(v) = p.visible {
        pet.visible = v;
    }
    if let Some(m) = &p.monitor {
        pet.monitor = Some(m.chars().take(128).collect());
        pet.pos_x = None;
        pet.pos_y = None;
    }
    c.execute(
        "UPDATE pets SET name=?2, color=?3, accessory=?4, visible=?5, monitor=?6, pos_x=?7, pos_y=?8 WHERE id=?1",
        params![id, pet.name, pet.color, pet.accessory, pet.visible, pet.monitor, pet.pos_x, pet.pos_y],
    )?;
    Ok(pet)
}

pub fn delete(db: &Db, id: i64) -> Result<(), PetError> {
    let c = db.conn();
    c.execute("DELETE FROM reward_actions WHERE pet_id = ?1", [id])?;
    if c.execute("DELETE FROM pets WHERE id = ?1", [id])? == 0 {
        return Err(PetError::NotFound);
    }
    Ok(())
}

pub fn save_position(db: &Db, id: i64, x: f64, y: f64, monitor: Option<&str>) -> Result<(), PetError> {
    if !x.is_finite() || !y.is_finite() {
        return Err(PetError::Invalid("bad position".into()));
    }
    db.conn().execute(
        "UPDATE pets SET pos_x = ?2, pos_y = ?3, monitor = COALESCE(?4, monitor) WHERE id = ?1",
        params![id, x, y, monitor],
    )?;
    Ok(())
}

fn clamp(v: f64) -> f64 {
    v.clamp(0.0, 100.0)
}

/// Needs drift per minute. A pet goes from full to very hungry in about ten hours of use.
pub fn tick_needs(p: &mut Pet, minutes: f64, asleep: bool) {
    p.hunger = clamp(p.hunger + 0.16 * minutes);
    let mood_drain = if p.hunger > 70.0 { 0.30 } else { 0.08 };
    p.happiness = clamp(p.happiness - mood_drain * minutes);
    p.energy = clamp(if asleep { p.energy + 0.8 * minutes } else { p.energy - 0.12 * minutes });
}

/// Returns false when the action is not one that changes needs (e.g. "dance" from Twitch still
/// animates but only "play" counts as play time).
pub fn apply_action(p: &mut Pet, action: &str, now: i64) -> bool {
    match action {
        "feed" => {
            p.hunger = clamp(p.hunger - 35.0);
            p.happiness = clamp(p.happiness + 5.0);
            p.last_fed_at = Some(now);
        }
        "play" => {
            p.happiness = clamp(p.happiness + 18.0);
            p.energy = clamp(p.energy - 8.0);
            p.hunger = clamp(p.hunger + 3.0);
            p.last_played_at = Some(now);
        }
        "pat" | "happy" => p.happiness = clamp(p.happiness + 4.0),
        "dance" | "celebrate" | "sing" | "trick" => p.happiness = clamp(p.happiness + 6.0),
        "joke" | "tickle" | "wave" => p.happiness = clamp(p.happiness + 3.0),
        "backflip" | "moonwalk" | "juggle" | "magic" | "karate" | "flex" | "peekaboo" | "shades"
        | "airguitar" | "bubblegum" | "cartwheel" | "tiptoe" | "yoyo" | "selfie" => {
            p.happiness = clamp(p.happiness + 5.0);
            p.energy = clamp(p.energy - 2.0);
        }
        "meditate" | "stretch" => p.energy = clamp(p.energy + 4.0),
        "sleep" => p.energy = clamp(p.energy + 10.0),
        _ => return false,
    }
    true
}

pub fn save_needs(db: &Db, p: &Pet) -> Result<(), PetError> {
    db.conn().execute(
        "UPDATE pets SET hunger=?2, happiness=?3, energy=?4, last_fed_at=?5, last_played_at=?6 WHERE id=?1",
        params![p.id, p.hunger, p.happiness, p.energy, p.last_fed_at, p.last_played_at],
    )?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn create_validates_species_name_and_limit() {
        let db = Db::open_in_memory().unwrap();
        assert!(create(&db, "dog", "Rex", 0).is_err());
        assert!(create(&db, "mochi", "   ", 0).is_err());
        let p = create(&db, "mochi", "  A very very long pet name  ", 0).unwrap();
        assert_eq!(p.name.chars().count(), MAX_NAME_LEN);
        for i in 1..MAX_PETS {
            create(&db, "pip", &format!("Pip {i}"), 0).unwrap();
        }
        assert!(matches!(create(&db, "pip", "One more", 0), Err(PetError::Invalid(_))));
    }

    #[test]
    fn update_and_delete() {
        let db = Db::open_in_memory().unwrap();
        let p = create(&db, "ember", "Sparky", 0).unwrap();
        let u = update(
            &db,
            p.id,
            &PetPatch { name: Some("Blaze".into()), color: Some("mint".into()), accessory: Some("crown".into()), ..Default::default() },
        )
        .unwrap();
        assert_eq!((u.name.as_str(), u.color.as_str(), u.accessory.as_str()), ("Blaze", "mint", "crown"));
        assert!(update(&db, p.id, &PetPatch { color: Some("plaid".into()), ..Default::default() }).is_err());
        delete(&db, p.id).unwrap();
        assert!(matches!(get(&db, p.id), Err(PetError::NotFound)));
    }

    #[test]
    fn needs_drift_and_actions() {
        let db = Db::open_in_memory().unwrap();
        let mut p = create(&db, "bolt", "Bolt", 0).unwrap();
        tick_needs(&mut p, 600.0, false);
        assert_eq!(p.hunger, 100.0);
        assert!(p.happiness < 80.0);
        let before = p.hunger;
        assert!(apply_action(&mut p, "feed", 10));
        assert_eq!(p.hunger, before - 35.0);
        assert_eq!(p.last_fed_at, Some(10));
        assert!(!apply_action(&mut p, "unknown", 10));
        tick_needs(&mut p, 1000.0, true);
        assert_eq!(p.energy, 100.0);
        save_needs(&db, &p).unwrap();
        assert_eq!(get(&db, p.id).unwrap().energy, 100.0);
    }
}
