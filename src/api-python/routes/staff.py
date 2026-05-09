from __future__ import annotations

from fastapi import APIRouter

from db.client import DbDep
from models import StaffCreate

router = APIRouter()


@router.get("/")
def list_staff(db: DbDep) -> list:
    return [dict(r) for r in db.execute("SELECT * FROM staff ORDER BY name").fetchall()]


@router.post("/", status_code=201)
def create_staff(body: StaffCreate, db: DbDep) -> dict:
    cur = db.execute(
        "INSERT INTO staff (facility_id, name, email, role) VALUES (?, ?, ?, ?)",
        (body.facility_id, body.name, body.email, body.role),
    )
    db.commit()
    return {"id": cur.lastrowid}
