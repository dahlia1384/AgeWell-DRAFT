from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.client import apply_schema
from routes import alerts, logs, residents, staff
from routes import ai as ai_routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    apply_schema()
    yield


app = FastAPI(title="AgeWell API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(residents.router, prefix="/api/residents", tags=["residents"])
app.include_router(logs.router, prefix="/api/logs", tags=["logs"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["alerts"])
app.include_router(staff.router, prefix="/api/staff", tags=["staff"])
app.include_router(ai_routes.router, prefix="/api/ai", tags=["ai"])


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()}
