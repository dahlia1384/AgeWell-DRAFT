CREATE TABLE IF NOT EXISTS facilities (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT    NOT NULL,
  address TEXT,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  facility_id INTEGER NOT NULL REFERENCES facilities(id),
  name        TEXT    NOT NULL,
  email       TEXT    UNIQUE NOT NULL,
  role        TEXT    NOT NULL CHECK(role IN ('admin', 'nurse', 'caregiver', 'researcher')),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS residents (
  id                         INTEGER PRIMARY KEY AUTOINCREMENT,
  facility_id                INTEGER NOT NULL REFERENCES facilities(id),
  first_name                 TEXT    NOT NULL,
  last_name                  TEXT    NOT NULL,
  date_of_birth              DATE    NOT NULL,
  room_number                TEXT    NOT NULL,
  admission_date             DATE    NOT NULL,
  diagnoses                  TEXT    DEFAULT '[]',
  medications                TEXT    DEFAULT '[]',
  allergies                  TEXT    DEFAULT '[]',
  preferences                TEXT    DEFAULT '{}',
  language                   TEXT    DEFAULT 'en',
  emergency_contact_name     TEXT,
  emergency_contact_phone    TEXT,
  emergency_contact_relation TEXT,
  photo_url                  TEXT,
  active                     INTEGER DEFAULT 1,
  created_at                 DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at                 DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consent_records (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  resident_id    INTEGER NOT NULL REFERENCES residents(id),
  consent_type   TEXT    NOT NULL CHECK(consent_type IN ('data_collection', 'ai_analysis', 'family_sharing')),
  consent_given  INTEGER NOT NULL DEFAULT 0,
  consent_date   DATE,
  guardian_name  TEXT,
  guardian_contact TEXT,
  notes          TEXT,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meal_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  resident_id INTEGER NOT NULL REFERENCES residents(id),
  staff_id    INTEGER REFERENCES staff(id),
  log_date    DATE    NOT NULL,
  meal_type   TEXT    NOT NULL CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  intake_pct  INTEGER CHECK(intake_pct BETWEEN 0 AND 100),
  food_items  TEXT,
  notes       TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sleep_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  resident_id INTEGER NOT NULL REFERENCES residents(id),
  staff_id    INTEGER REFERENCES staff(id),
  log_date    DATE    NOT NULL,
  hours       REAL,
  quality     INTEGER CHECK(quality BETWEEN 1 AND 5),
  notes       TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mood_checkins (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  resident_id INTEGER NOT NULL REFERENCES residents(id),
  staff_id    INTEGER REFERENCES staff(id),
  log_date    DATE    NOT NULL,
  mood        INTEGER NOT NULL CHECK(mood BETWEEN 1 AND 5),
  notes       TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medication_records (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  resident_id      INTEGER NOT NULL REFERENCES residents(id),
  staff_id         INTEGER REFERENCES staff(id),
  medication_name  TEXT    NOT NULL,
  dose             TEXT,
  administered_at  DATETIME NOT NULL,
  given            INTEGER  DEFAULT 1,
  refusal_reason   TEXT,
  notes            TEXT,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  resident_id         INTEGER NOT NULL REFERENCES residents(id),
  staff_id            INTEGER REFERENCES staff(id),
  log_date            DATE    NOT NULL,
  activity_name       TEXT    NOT NULL,
  participation_level TEXT    CHECK(participation_level IN ('full', 'partial', 'observed', 'none')),
  notes               TEXT,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incidents (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  resident_id   INTEGER NOT NULL REFERENCES residents(id),
  staff_id      INTEGER REFERENCES staff(id),
  incident_type TEXT    NOT NULL CHECK(incident_type IN ('fall', 'near_fall', 'behavior', 'medical', 'other')),
  severity      TEXT    NOT NULL CHECK(severity IN ('low', 'medium', 'high')),
  description   TEXT    NOT NULL,
  location      TEXT,
  occurred_at   DATETIME NOT NULL,
  actions_taken TEXT,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  resident_id      INTEGER NOT NULL REFERENCES residents(id),
  alert_type       TEXT    NOT NULL CHECK(alert_type IN ('manual', 'system', 'ai_generated')),
  category         TEXT    NOT NULL CHECK(category IN ('safety', 'health', 'behavior', 'medication', 'other')),
  message          TEXT    NOT NULL,
  severity         TEXT    NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  status           TEXT    NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'acknowledged', 'resolved')),
  acknowledged_by  INTEGER REFERENCES staff(id),
  acknowledged_at  DATETIME,
  resolved_by      INTEGER REFERENCES staff(id),
  resolved_at      DATETIME,
  resolution_notes TEXT,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);
