CREATE TABLE pets (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    species        TEXT    NOT NULL,
    name           TEXT    NOT NULL,
    color          TEXT    NOT NULL DEFAULT 'classic',
    accessory      TEXT    NOT NULL DEFAULT 'none',
    visible        INTEGER NOT NULL DEFAULT 1,
    monitor        TEXT,
    pos_x          REAL,
    pos_y          REAL,
    hunger         REAL    NOT NULL DEFAULT 20,
    happiness      REAL    NOT NULL DEFAULT 80,
    energy         REAL    NOT NULL DEFAULT 90,
    created_at     INTEGER NOT NULL,
    last_fed_at    INTEGER,
    last_played_at INTEGER,
    sort_order     INTEGER NOT NULL DEFAULT 0
);

-- Typed settings and small records serialized as JSON (see settings.rs).
CREATE TABLE kv (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE trial_state (
    id           INTEGER PRIMARY KEY CHECK (id = 1),
    started_at   INTEGER NOT NULL,
    last_seen_at INTEGER NOT NULL,
    server_token TEXT
);

CREATE TABLE license_state (
    id              INTEGER PRIMARY KEY CHECK (id = 1),
    token           TEXT    NOT NULL,
    key_hint        TEXT    NOT NULL,
    last_checked_at INTEGER,
    last_error      TEXT
);

CREATE TABLE reward_actions (
    reward_id    TEXT PRIMARY KEY,
    reward_title TEXT NOT NULL,
    action       TEXT NOT NULL,
    pet_id       INTEGER
);
