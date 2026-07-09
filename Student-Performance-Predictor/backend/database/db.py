import sqlite3
import os
import uuid
from threading import local

_db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "spp.db")
_local = local()


def _conn():
    if not hasattr(_local, "conn") or _local.conn is None:
        os.makedirs(os.path.dirname(_db_path), exist_ok=True)
        _local.conn = sqlite3.connect(_db_path, check_same_thread=False)
        _local.conn.row_factory = sqlite3.Row
        _local.conn.execute("PRAGMA journal_mode=WAL")
        _local.conn.execute("PRAGMA foreign_keys=ON")
    return _local.conn


def init_db():
    c = _conn().cursor()
    c.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL, role TEXT DEFAULT 'faculty',
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS students (
            id TEXT PRIMARY KEY, student_id TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
            department TEXT NOT NULL, semester INTEGER NOT NULL, age INTEGER NOT NULL,
            gender TEXT NOT NULL, attendance REAL NOT NULL, study_hours REAL NOT NULL,
            assignment_score REAL NOT NULL, internal_marks REAL NOT NULL,
            previous_marks REAL NOT NULL, created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS datasets (
            id TEXT PRIMARY KEY, file_name TEXT NOT NULL, rows INTEGER DEFAULT 0,
            columns INTEGER DEFAULT 0, uploaded_by TEXT,
            uploaded_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS predictions (
            id TEXT PRIMARY KEY, student_id TEXT, student_name TEXT, department TEXT,
            semester INTEGER, attendance REAL, study_hours REAL, assignment_score REAL,
            internal_marks REAL, previous_marks REAL, predicted_marks REAL, grade TEXT,
            performance TEXT, risk_level TEXT, recommendation TEXT, algorithm TEXT,
            accuracy REAL, created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY, report_name TEXT NOT NULL, report_type TEXT NOT NULL,
            generated_by TEXT, data TEXT, created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS ml_models (
            id TEXT PRIMARY KEY, model_name TEXT NOT NULL, algorithm TEXT NOT NULL,
            accuracy REAL, precision REAL, recall REAL, f1_score REAL, mae REAL,
            rmse REAL, r2_score REAL, file_path TEXT, is_active INTEGER DEFAULT 0,
            trained_by TEXT, created_at TEXT DEFAULT (datetime('now'))
        );
    """)
    _conn().commit()


class Result:
    def __init__(self, data=None, count=0):
        self.data = data or []
        self.count = count


def _all(table, order=None, desc=True, limit=None):
    cur = _conn().cursor()
    sql = f"SELECT * FROM {table}"
    if order:
        sql += f" ORDER BY {order} {'DESC' if desc else 'ASC'}"
    if limit:
        sql += f" LIMIT {limit}"
    cur.execute(sql)
    rows = [dict(r) for r in cur.fetchall()]
    return Result(rows, len(rows))


def _find(table, col, val):
    cur = _conn().cursor()
    cur.execute(f"SELECT * FROM {table} WHERE {col} = ?", [val])
    rows = [dict(r) for r in cur.fetchall()]
    return Result(rows, len(rows))


def _search(table, search_term, search_cols, order="created_at", desc=True, page=1, per_page=20, filters=None):
    cur = _conn().cursor()
    where_parts = []
    params = []
    if search_term:
        or_parts = [f"{col} LIKE ?" for col in search_cols]
        where_parts.append(f"({' OR '.join(or_parts)})")
        for _ in search_cols:
            params.append(f"%{search_term}%")
    if filters:
        for col, val in filters.items():
            if val:
                where_parts.append(f"{col} = ?")
                params.append(val)
    where = ""
    if where_parts:
        where = " WHERE " + " AND ".join(where_parts)
    count_sql = f"SELECT COUNT(*) as cnt FROM {table}{where}"
    cur.execute(count_sql, params)
    total = cur.fetchone()[0]
    offset = (page - 1) * per_page
    sql = f"SELECT * FROM {table}{where} ORDER BY {order} LIMIT {per_page} OFFSET {offset}"
    cur.execute(sql, params)
    rows = [dict(r) for r in cur.fetchall()]
    return Result(rows, total)


def _insert(table, data):
    data = dict(data)
    if "id" not in data:
        data["id"] = str(uuid.uuid4())
    cols = ", ".join(data.keys())
    placeholders = ", ".join(["?" for _ in data])
    _conn().cursor().execute(f"INSERT INTO {table} ({cols}) VALUES ({placeholders})", list(data.values()))
    _conn().commit()
    return _find(table, "id", data["id"])


def _update(table, col, val, data):
    set_clause = ", ".join([f"{k} = ?" for k in data.keys()])
    _conn().cursor().execute(f"UPDATE {table} SET {set_clause} WHERE {col} = ?", list(data.values()) + [val])
    _conn().commit()


def _delete(table, col, val):
    _conn().cursor().execute(f"DELETE FROM {table} WHERE {col} = ?", [val])
    _conn().commit()