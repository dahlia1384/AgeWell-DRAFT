from __future__ import annotations

import datetime
from typing import Optional

from fastapi import APIRouter, Query

from db.client import DbDep
from models import (
    ActivityLogCreate,
    IncidentCreate,
    MealLogCreate,
    MedicationRecordCreate,
    MoodCheckinCreate,
    SleepLogCreate,
)

router = APIRouter()


@router.post("/meal", status_code=201)
def log_meal(body: MealLogCreate, db: DbDep) -> dict:
    cur = db.execute(
        "INSERT INTO meal_logs (resident_id, staff_id, log_date, meal_type, intake_pct, food_items, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (body.resident_id, body.staff_id, body.log_date, body.meal_type, body.intake_pct, body.food_items, body.notes),
    )
    db.commit()
    return {"id": cur.lastrowid}


@router.post("/sleep", status_code=201)
def log_sleep(body: SleepLogCreate, db: DbDep) -> dict:
    cur = db.execute(
        "INSERT INTO sleep_logs (resident_id, staff_id, log_date, hours, quality, notes) VALUES (?, ?, ?, ?, ?, ?)",
        (body.resident_id, body.staff_id, body.log_date, body.hours, body.quality, body.notes),
    )
    db.commit()
    return {"id": cur.lastrowid}


@router.post("/mood", status_code=201)
def log_mood(body: MoodCheckinCreate, db: DbDep) -> dict:
    cur = db.execute(
        "INSERT INTO mood_checkins (resident_id, staff_id, log_date, mood, notes) VALUES (?, ?, ?, ?, ?)",
        (body.resident_id, body.staff_id, body.log_date, body.mood, body.notes),
    )
    db.commit()
    return {"id": cur.lastrowid}


@router.post("/medication", status_code=201)
def log_medication(body: MedicationRecordCreate, db: DbDep) -> dict:
    cur = db.execute(
        "INSERT INTO medication_records (resident_id, staff_id, medication_name, dose, administered_at, given, refusal_reason, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (body.resident_id, body.staff_id, body.medication_name, body.dose,
         body.administered_at, 1 if body.given else 0, body.refusal_reason, body.notes),
    )
    db.commit()
    return {"id": cur.lastrowid}


@router.post("/activity", status_code=201)
def log_activity(body: ActivityLogCreate, db: DbDep) -> dict:
    cur = db.execute(
        "INSERT INTO activity_logs (resident_id, staff_id, log_date, activity_name, participation_level, notes) VALUES (?, ?, ?, ?, ?, ?)",
        (body.resident_id, body.staff_id, body.log_date, body.activity_name, body.participation_level, body.notes),
    )
    db.commit()
    return {"id": cur.lastrowid}


@router.post("/incident", status_code=201)
def log_incident(body: IncidentCreate, db: DbDep) -> dict:
    cur = db.execute(
        "INSERT INTO incidents (resident_id, staff_id, incident_type, severity, description, location, occurred_at, actions_taken) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (body.resident_id, body.staff_id, body.incident_type, body.severity,
         body.description, body.location, body.occurred_at, body.actions_taken),
    )
    incident_id = cur.lastrowid

    if body.severity == "high":
        db.execute(
            "INSERT INTO alerts (resident_id, alert_type, category, message, severity) VALUES (?, 'system', 'safety', ?, 'high')",
            (body.resident_id, f"Incident reported: {body.description[:100]}"),
        )

    db.commit()
    return {"id": incident_id}


@router.get("/{resident_id}")
def get_history(
    resident_id: int,
    db: DbDep,
    days: int = Query(default=7, ge=1, le=365),
    end: Optional[str] = Query(default=None, alias="date"),
) -> dict:
    end_date = datetime.date.fromisoformat(end) if end else datetime.date.today()
    start_date = end_date - datetime.timedelta(days=days)
    start = start_date.isoformat()
    end_str = end_date.isoformat()

    return {
        "mealLogs": [dict(r) for r in db.execute(
            "SELECT * FROM meal_logs WHERE resident_id = ? AND log_date BETWEEN ? AND ? ORDER BY log_date DESC, created_at DESC",
            (resident_id, start, end_str),
        ).fetchall()],
        "sleepLogs": [dict(r) for r in db.execute(
            "SELECT * FROM sleep_logs WHERE resident_id = ? AND log_date BETWEEN ? AND ? ORDER BY log_date DESC",
            (resident_id, start, end_str),
        ).fetchall()],
        "moodCheckins": [dict(r) for r in db.execute(
            "SELECT * FROM mood_checkins WHERE resident_id = ? AND log_date BETWEEN ? AND ? ORDER BY log_date DESC",
            (resident_id, start, end_str),
        ).fetchall()],
        "medicationRecords": [dict(r) for r in db.execute(
            "SELECT * FROM medication_records WHERE resident_id = ? AND date(administered_at) BETWEEN ? AND ? ORDER BY administered_at DESC",
            (resident_id, start, end_str),
        ).fetchall()],
        "activityLogs": [dict(r) for r in db.execute(
            "SELECT * FROM activity_logs WHERE resident_id = ? AND log_date BETWEEN ? AND ? ORDER BY log_date DESC",
            (resident_id, start, end_str),
        ).fetchall()],
        "incidents": [dict(r) for r in db.execute(
            "SELECT * FROM incidents WHERE resident_id = ? AND date(occurred_at) BETWEEN ? AND ? ORDER BY occurred_at DESC",
            (resident_id, start, end_str),
        ).fetchall()],
    }
