import sqlite3
from pathlib import Path
from typing import Annotated, Generator

from fastapi import Depends

REPO_ROOT = Path(__file__).resolve().parents[3]
DB_PATH = REPO_ROOT / "data" / "agewell.db"
SCHEMA_PATH = REPO_ROOT / "src" / "api" / "src" / "db" / "schema.sql"

DB_PATH.parent.mkdir(exist_ok=True)


def apply_schema() -> None:
    schema = SCHEMA_PATH.read_text()
    conn = sqlite3.connect(str(DB_PATH))
    conn.executescript(schema)
    conn.commit()
    conn.close()


def _db_connection() -> Generator[sqlite3.Connection, None, None]:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
    finally:
        conn.close()


DbDep = Annotated[sqlite3.Connection, Depends(_db_connection)]
