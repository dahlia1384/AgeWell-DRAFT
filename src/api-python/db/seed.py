#!/usr/bin/env python3
"""Seed the database with sample data. Run from src/api-python/:
    python db/seed.py
"""
from __future__ import annotations

import json
import sqlite3
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from db.client import DB_PATH, SCHEMA_PATH


def seed() -> None:
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(SCHEMA_PATH.read_text())
    conn.commit()

    count = conn.execute("SELECT COUNT(*) FROM facilities").fetchone()[0]
    if count > 0:
        print("Database already seeded. Skipping.")
        conn.close()
        return

    cur = conn.execute(
        "INSERT INTO facilities (name, address, phone) VALUES (?, ?, ?)",
        ("Sunrise Care Home", "123 Elm Street, Toronto, ON M5V 1A1", "(416) 555-0100"),
    )
    facility_id = cur.lastrowid

    cur = conn.execute(
        "INSERT INTO staff (facility_id, name, email, role) VALUES (?, ?, ?, ?)",
        (facility_id, "Dr. Sarah Chen", "sarah.chen@sunrise.ca", "admin"),
    )
    admin_id = cur.lastrowid
    conn.execute(
        "INSERT INTO staff (facility_id, name, email, role) VALUES (?, ?, ?, ?)",
        (facility_id, "Nurse Maria Santos", "maria.santos@sunrise.ca", "nurse"),
    )
    conn.execute(
        "INSERT INTO staff (facility_id, name, email, role) VALUES (?, ?, ?, ?)",
        (facility_id, "James Wilson", "james.wilson@sunrise.ca", "caregiver"),
    )

    def insert_resident(
        first: str, last: str, dob: str, room: str, admitted: str,
        diagnoses: list, meds: list, allergies: list, prefs: dict,
        ec_name: str, ec_phone: str, ec_rel: str,
    ) -> int:
        cur = conn.execute("""
            INSERT INTO residents (
                facility_id, first_name, last_name, date_of_birth, room_number, admission_date,
                diagnoses, medications, allergies, preferences, language,
                emergency_contact_name, emergency_contact_phone, emergency_contact_relation
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en', ?, ?, ?)
        """, (
            facility_id, first, last, dob, room, admitted,
            json.dumps(diagnoses), json.dumps(meds), json.dumps(allergies), json.dumps(prefs),
            ec_name, ec_phone, ec_rel,
        ))
        return cur.lastrowid  # type: ignore[return-value]

    r1 = insert_resident(
        "Margaret", "Thompson", "1938-03-15", "101A", "2023-01-10",
        ["Type 2 Diabetes", "Hypertension", "Mild cognitive impairment"],
        [
            {"name": "Metformin", "dose": "500mg", "frequency": "twice daily"},
            {"name": "Lisinopril", "dose": "10mg", "frequency": "once daily"},
            {"name": "Aspirin", "dose": "81mg", "frequency": "once daily"},
        ],
        ["Penicillin"],
        {"preferred_activities": ["bingo", "gardening"], "dietary_restrictions": ["low sodium"]},
        "Robert Thompson", "(416) 555-0201", "Son",
    )

    r2 = insert_resident(
        "Henry", "Nakamura", "1932-07-22", "203B", "2022-06-15",
        ["Parkinson's Disease", "Osteoarthritis", "Depression"],
        [
            {"name": "Levodopa", "dose": "100mg", "frequency": "three times daily"},
            {"name": "Sertraline", "dose": "50mg", "frequency": "once daily"},
            {"name": "Calcium + Vitamin D", "dose": "600mg/400IU", "frequency": "once daily"},
        ],
        ["Sulfa drugs", "Shellfish"],
        {"preferred_activities": ["reading", "chess"], "dietary_restrictions": []},
        "Yuki Nakamura", "(416) 555-0312", "Daughter",
    )

    r3 = insert_resident(
        "Eleanor", "Osei", "1940-11-03", "115C", "2023-08-20",
        ["Congestive Heart Failure", "Atrial Fibrillation", "Hypothyroidism"],
        [
            {"name": "Warfarin", "dose": "2.5mg", "frequency": "once daily"},
            {"name": "Metoprolol", "dose": "25mg", "frequency": "twice daily"},
            {"name": "Levothyroxine", "dose": "50mcg", "frequency": "once daily"},
        ],
        [],
        {"preferred_activities": ["tv", "knitting"], "dietary_restrictions": ["low fluid"]},
        "Kwame Osei", "(416) 555-0423", "Nephew",
    )

    today = date.today().isoformat()

    for resident_id in (r1, r2, r3):
        for consent_type in ("data_collection", "ai_analysis", "family_sharing"):
            conn.execute(
                "INSERT INTO consent_records (resident_id, consent_given, consent_date, consent_type) VALUES (?, 1, ?, ?)",
                (resident_id, today, consent_type),
            )

    conn.execute(
        "INSERT INTO meal_logs (resident_id, staff_id, log_date, meal_type, intake_pct, notes) VALUES (?, ?, ?, ?, ?, ?)",
        (r1, admin_id, today, "breakfast", 75, "Good appetite, finished most of porridge"),
    )
    conn.execute(
        "INSERT INTO sleep_logs (resident_id, staff_id, log_date, hours, quality, notes) VALUES (?, ?, ?, ?, ?, ?)",
        (r1, admin_id, today, 7.5, 3, "Woke twice during the night, seemed restless"),
    )
    conn.execute(
        "INSERT INTO mood_checkins (resident_id, staff_id, log_date, mood, notes) VALUES (?, ?, ?, ?, ?)",
        (r1, admin_id, today, 4, "Cheerful, chatting with other residents at breakfast"),
    )
    conn.execute(
        "INSERT INTO alerts (resident_id, alert_type, category, message, severity) VALUES (?, 'manual', 'health', ?, 'medium')",
        (r2, "Blood pressure elevated: 158/92 mmHg. Monitor every 2 hours."),
    )
    conn.execute(
        "INSERT INTO alerts (resident_id, alert_type, category, message, severity) VALUES (?, 'manual', 'medication', ?, 'high')",
        (r3, "Warfarin dose adjustment pending INR results from lab."),
    )

    conn.commit()
    conn.close()
    print("Database seeded: 3 residents, sample logs, 2 alerts.")


if __name__ == "__main__":
    seed()
