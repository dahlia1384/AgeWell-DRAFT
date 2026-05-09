from __future__ import annotations

import json
import sqlite3
from datetime import date, timedelta

from db.client import DB_PATH


def build_resident_context(resident_id: int) -> str:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")

    try:
        row = conn.execute(
            "SELECT * FROM residents WHERE id = ? AND active = 1", (resident_id,)
        ).fetchone()

        if not row:
            raise ValueError(f"Resident {resident_id} not found")

        diagnoses: list[str] = json.loads(row["diagnoses"] or "[]")
        medications: list[dict] = json.loads(row["medications"] or "[]")
        allergies: list[str] = json.loads(row["allergies"] or "[]")
        prefs: dict = json.loads(row["preferences"] or "{}")

        dob = date.fromisoformat(row["date_of_birth"])
        today = date.today()
        age = (today - dob).days // 365
        cutoff = (today - timedelta(days=7)).isoformat()

        sleeps = conn.execute(
            "SELECT log_date, hours, quality, notes FROM sleep_logs WHERE resident_id = ? AND log_date >= ? ORDER BY log_date DESC",
            (resident_id, cutoff),
        ).fetchall()

        meals = conn.execute(
            "SELECT log_date, meal_type, intake_pct, notes FROM meal_logs WHERE resident_id = ? AND log_date >= ? ORDER BY log_date DESC, created_at DESC",
            (resident_id, cutoff),
        ).fetchall()

        moods = conn.execute(
            "SELECT log_date, mood, notes FROM mood_checkins WHERE resident_id = ? AND log_date >= ? ORDER BY log_date DESC",
            (resident_id, cutoff),
        ).fetchall()

        med_records = conn.execute(
            "SELECT medication_name, dose, given, refusal_reason, administered_at FROM medication_records WHERE resident_id = ? AND date(administered_at) >= ? ORDER BY administered_at DESC",
            (resident_id, cutoff),
        ).fetchall()

        activities = conn.execute(
            "SELECT log_date, activity_name, participation_level, notes FROM activity_logs WHERE resident_id = ? AND log_date >= ? ORDER BY log_date DESC",
            (resident_id, cutoff),
        ).fetchall()

        incidents = conn.execute(
            "SELECT incident_type, severity, description, occurred_at FROM incidents WHERE resident_id = ? AND date(occurred_at) >= ? ORDER BY occurred_at DESC",
            (resident_id, cutoff),
        ).fetchall()

        active_alerts = conn.execute(
            "SELECT category, message, severity FROM alerts WHERE resident_id = ? AND status = 'open' ORDER BY created_at DESC",
            (resident_id,),
        ).fetchall()

    finally:
        conn.close()

    lines: list[str] = []

    lines.append("RESIDENT PROFILE")
    lines.append(f"Name: {row['first_name']} {row['last_name']}")
    lines.append(f"Age: {age} (DOB: {row['date_of_birth']})")
    lines.append(f"Room: {row['room_number']} | Admitted: {row['admission_date']}")
    lines.append(f"Language: {row['language']}")
    lines.append("")
    lines.append(f"DIAGNOSES: {', '.join(diagnoses) or 'None recorded'}")
    lines.append(f"ALLERGIES: {', '.join(allergies) or 'None known'}")
    lines.append("")
    lines.append("STANDING MEDICATIONS:")
    if medications:
        for m in medications:
            lines.append(f"  - {m['name']} {m['dose']} {m['frequency']}")
    else:
        lines.append("  None")

    preferred = prefs.get("preferred_activities", [])
    dietary = prefs.get("dietary_restrictions", [])
    if preferred or dietary:
        lines.append("")
        lines.append("PREFERENCES:")
        if preferred:
            lines.append(f"  Activities: {', '.join(preferred)}")
        if dietary:
            lines.append(f"  Dietary: {', '.join(dietary)}")

    if row["emergency_contact_name"]:
        lines.append("")
        lines.append(f"EMERGENCY CONTACT: {row['emergency_contact_name']} ({row['emergency_contact_relation']}) — {row['emergency_contact_phone']}")

    lines.append("")
    lines.append("--- 7-DAY CARE LOG HISTORY ---")

    if active_alerts:
        lines.append("")
        lines.append("ACTIVE ALERTS:")
        for a in active_alerts:
            lines.append(f"  [{a['severity'].upper()}] {a['category']}: {a['message']}")

    if sleeps:
        lines.append("")
        lines.append("SLEEP:")
        for s in sleeps:
            note = f" — {s['notes']}" if s["notes"] else ""
            lines.append(f"  {s['log_date']}: {s['hours']}h, quality {s['quality']}/5{note}")

    if meals:
        lines.append("")
        lines.append("MEALS:")
        for m in meals:
            note = f" — {m['notes']}" if m["notes"] else ""
            lines.append(f"  {m['log_date']} {m['meal_type']}: {m['intake_pct'] or '?'}% intake{note}")

    if moods:
        lines.append("")
        lines.append("MOOD:")
        for m in moods:
            note = f" — {m['notes']}" if m["notes"] else ""
            lines.append(f"  {m['log_date']}: {m['mood']}/5{note}")

    if med_records:
        lines.append("")
        lines.append("MEDICATION RECORDS:")
        for m in med_records:
            status = "given" if m["given"] else f"REFUSED: {m['refusal_reason'] or 'no reason given'}"
            dose = f" {m['dose']}" if m["dose"] else ""
            lines.append(f"  {m['administered_at']}: {m['medication_name']}{dose} — {status}")

    if activities:
        lines.append("")
        lines.append("ACTIVITIES:")
        for a in activities:
            note = f" — {a['notes']}" if a["notes"] else ""
            lines.append(f"  {a['log_date']}: {a['activity_name']} ({a['participation_level']}){note}")

    if incidents:
        lines.append("")
        lines.append("INCIDENTS:")
        for i in incidents:
            lines.append(f"  {i['occurred_at']}: [{i['severity'].upper()}] {i['incident_type']} — {i['description']}")

    return "\n".join(lines)
