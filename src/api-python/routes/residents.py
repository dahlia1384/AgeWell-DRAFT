from __future__ import annotations

import json
import sqlite3
from datetime import date

from fastapi import APIRouter, HTTPException

from db.client import DbDep
from models import ResidentCreate, ResidentUpdate

router = APIRouter()


def _parse(row: sqlite3.Row) -> dict:
    d = dict(row)
    for field in ("diagnoses", "medications", "allergies", "preferences"):
        if d.get(field):
            d[field] = json.loads(d[field])
    d["active"] = bool(d.get("active", 1))
    return d


@router.get("/")
def list_residents(db: DbDep) -> list:
    rows = db.execute("""
        SELECT r.*, f.name AS facility_name
        FROM residents r
        LEFT JOIN facilities f ON r.facility_id = f.id
        WHERE r.active = 1
        ORDER BY r.last_name, r.first_name
    """).fetchall()
    return [_parse(r) for r in rows]


@router.get("/{resident_id}")
def get_resident(resident_id: int, db: DbDep) -> dict:
    row = db.execute("""
        SELECT r.*, f.name AS facility_name
        FROM residents r
        LEFT JOIN facilities f ON r.facility_id = f.id
        WHERE r.id = ?
    """, (resident_id,)).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Resident not found")

    today = date.today().isoformat()

    todays_logs = {
        "mealLogs": [dict(r) for r in db.execute(
            "SELECT * FROM meal_logs WHERE resident_id = ? AND log_date = ? ORDER BY created_at",
            (resident_id, today),
        ).fetchall()],
        "sleepLogs": [dict(r) for r in db.execute(
            "SELECT * FROM sleep_logs WHERE resident_id = ? AND log_date = ?",
            (resident_id, today),
        ).fetchall()],
        "moodCheckins": [dict(r) for r in db.execute(
            "SELECT * FROM mood_checkins WHERE resident_id = ? AND log_date = ?",
            (resident_id, today),
        ).fetchall()],
        "medicationRecords": [dict(r) for r in db.execute(
            "SELECT * FROM medication_records WHERE resident_id = ? AND date(administered_at) = ? ORDER BY administered_at",
            (resident_id, today),
        ).fetchall()],
        "activityLogs": [dict(r) for r in db.execute(
            "SELECT * FROM activity_logs WHERE resident_id = ? AND log_date = ?",
            (resident_id, today),
        ).fetchall()],
    }

    active_alerts = [dict(r) for r in db.execute(
        "SELECT * FROM alerts WHERE resident_id = ? AND status != 'resolved' ORDER BY created_at DESC LIMIT 10",
        (resident_id,),
    ).fetchall()]

    return {**_parse(row), "todaysLogs": todays_logs, "activeAlerts": active_alerts}


@router.post("/", status_code=201)
def create_resident(body: ResidentCreate, db: DbDep) -> dict:
    cur = db.execute("""
        INSERT INTO residents (
            facility_id, first_name, last_name, date_of_birth, room_number, admission_date,
            diagnoses, medications, allergies, preferences, language,
            emergency_contact_name, emergency_contact_phone, emergency_contact_relation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        body.facility_id, body.first_name, body.last_name, body.date_of_birth,
        body.room_number, body.admission_date,
        json.dumps(body.diagnoses), json.dumps(body.medications),
        json.dumps(body.allergies), json.dumps(body.preferences),
        body.language,
        body.emergency_contact_name, body.emergency_contact_phone, body.emergency_contact_relation,
    ))
    db.commit()
    return {"id": cur.lastrowid}


@router.put("/{resident_id}")
def update_resident(resident_id: int, body: ResidentUpdate, db: DbDep) -> dict:
    db.execute("""
        UPDATE residents SET
            first_name                 = COALESCE(?, first_name),
            last_name                  = COALESCE(?, last_name),
            room_number                = COALESCE(?, room_number),
            diagnoses                  = COALESCE(?, diagnoses),
            medications                = COALESCE(?, medications),
            allergies                  = COALESCE(?, allergies),
            preferences                = COALESCE(?, preferences),
            language                   = COALESCE(?, language),
            emergency_contact_name     = COALESCE(?, emergency_contact_name),
            emergency_contact_phone    = COALESCE(?, emergency_contact_phone),
            emergency_contact_relation = COALESCE(?, emergency_contact_relation),
            active                     = COALESCE(?, active),
            updated_at                 = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (
        body.first_name, body.last_name, body.room_number,
        json.dumps(body.diagnoses) if body.diagnoses is not None else None,
        json.dumps(body.medications) if body.medications is not None else None,
        json.dumps(body.allergies) if body.allergies is not None else None,
        json.dumps(body.preferences) if body.preferences is not None else None,
        body.language,
        body.emergency_contact_name, body.emergency_contact_phone, body.emergency_contact_relation,
        (1 if body.active else 0) if body.active is not None else None,
        resident_id,
    ))
    db.commit()
    return {"success": True}
