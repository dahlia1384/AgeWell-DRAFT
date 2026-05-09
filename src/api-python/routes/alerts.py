from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Query

from db.client import DbDep
from models import AlertAcknowledge, AlertCreate, AlertResolve

router = APIRouter()


@router.get("/")
def list_alerts(
    db: DbDep,
    status: Optional[str] = Query(default=None),
    facility_id: Optional[int] = Query(default=None),
) -> list:
    sql = """
        SELECT a.*, r.first_name, r.last_name, r.room_number
        FROM alerts a
        JOIN residents r ON a.resident_id = r.id
        WHERE 1=1
    """
    params: list = []

    if status:
        sql += " AND a.status = ?"
        params.append(status)
    if facility_id:
        sql += " AND r.facility_id = ?"
        params.append(facility_id)

    sql += " ORDER BY a.created_at DESC LIMIT 200"

    return [dict(r) for r in db.execute(sql, params).fetchall()]


@router.post("/", status_code=201)
def create_alert(body: AlertCreate, db: DbDep) -> dict:
    cur = db.execute(
        "INSERT INTO alerts (resident_id, alert_type, category, message, severity) VALUES (?, 'manual', ?, ?, ?)",
        (body.resident_id, body.category, body.message, body.severity),
    )
    db.commit()
    return {"id": cur.lastrowid}


@router.put("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, body: AlertAcknowledge, db: DbDep) -> dict:
    db.execute(
        "UPDATE alerts SET status='acknowledged', acknowledged_by=?, acknowledged_at=CURRENT_TIMESTAMP WHERE id=? AND status='open'",
        (body.staff_id, alert_id),
    )
    db.commit()
    return {"success": True}


@router.put("/{alert_id}/resolve")
def resolve_alert(alert_id: int, body: AlertResolve, db: DbDep) -> dict:
    db.execute(
        "UPDATE alerts SET status='resolved', resolved_by=?, resolved_at=CURRENT_TIMESTAMP, resolution_notes=? WHERE id=?",
        (body.staff_id, body.resolution_notes, alert_id),
    )
    db.commit()
    return {"success": True}
