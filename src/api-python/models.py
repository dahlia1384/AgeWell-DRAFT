from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel


class ResidentCreate(BaseModel):
    facility_id: int
    first_name: str
    last_name: str
    date_of_birth: str
    room_number: str
    admission_date: str
    diagnoses: list[str] = []
    medications: list[Any] = []
    allergies: list[str] = []
    preferences: dict[str, Any] = {}
    language: str = "en"
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None


class ResidentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    room_number: Optional[str] = None
    diagnoses: Optional[list[str]] = None
    medications: Optional[list[Any]] = None
    allergies: Optional[list[str]] = None
    preferences: Optional[dict[str, Any]] = None
    language: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    active: Optional[bool] = None


class MealLogCreate(BaseModel):
    resident_id: int
    staff_id: Optional[int] = None
    log_date: str
    meal_type: str
    intake_pct: Optional[int] = None
    food_items: Optional[str] = None
    notes: Optional[str] = None


class SleepLogCreate(BaseModel):
    resident_id: int
    staff_id: Optional[int] = None
    log_date: str
    hours: Optional[float] = None
    quality: Optional[int] = None
    notes: Optional[str] = None


class MoodCheckinCreate(BaseModel):
    resident_id: int
    staff_id: Optional[int] = None
    log_date: str
    mood: int
    notes: Optional[str] = None


class MedicationRecordCreate(BaseModel):
    resident_id: int
    staff_id: Optional[int] = None
    medication_name: str
    dose: Optional[str] = None
    administered_at: str
    given: bool = True
    refusal_reason: Optional[str] = None
    notes: Optional[str] = None


class ActivityLogCreate(BaseModel):
    resident_id: int
    staff_id: Optional[int] = None
    log_date: str
    activity_name: str
    participation_level: Optional[str] = None
    notes: Optional[str] = None


class IncidentCreate(BaseModel):
    resident_id: int
    staff_id: Optional[int] = None
    incident_type: str
    severity: str
    description: str
    location: Optional[str] = None
    occurred_at: str
    actions_taken: Optional[str] = None


class AlertCreate(BaseModel):
    resident_id: int
    category: str
    message: str
    severity: str


class AlertAcknowledge(BaseModel):
    staff_id: Optional[int] = None


class AlertResolve(BaseModel):
    staff_id: Optional[int] = None
    resolution_notes: Optional[str] = None


class StaffCreate(BaseModel):
    facility_id: int
    name: str
    email: str
    role: str


class ChatRequest(BaseModel):
    message: str
    history: list[dict[str, str]] = []


class CareNoteRequest(BaseModel):
    shiftNotes: str = ""
