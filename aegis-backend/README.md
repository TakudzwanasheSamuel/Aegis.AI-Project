# AegisAI backend microservice

Path: `aegis-backend/`  
Stack: **FastAPI**, **Uvicorn**, **Pydantic v2**, **SQLAlchemy 2.x** (SQLite), **scikit-learn**, **XGBoost**, **SHAP**.

Entry point: `app/main.py` (`title="AegisAI Cybersecurity Threat Engine"`, `version="1.0.0"`).

On startup `init_db()` creates `app/data/aegisai.db` and adds `harmonized_vector` if the table pre-existed without that column.

---

## 1. Architecture overview

```
Uvicorn 127.0.0.1:8000
  ├── CORSMiddleware (allow_origins=["*"])
  ├── GET  /health
  ├── GET  /api/v1/health
  ├── router telemetry  prefix=/api/v1/telemetry
  ├── router analytics  prefix=/api/v1/analytics
  └── router demo       prefix=/api/v1/demo

POST /assess pipeline
  TelemetryPayload (system-wide counters + optional file-activity fields)
    → FeatureHarmonizationService.harmonize   # rename to the 8 CIC names
    → PredictionService.predict                # mean(RF, XGB) P(malware)
    → SHAPExplainabilityService                # TreeExplainer on RF
    → _combine_verdicts                        # more severe of model and behavioural
    → AssessmentRecord insert
    → AssessmentResponse
```

Services load joblib artifacts from `app/ml/` at process start. Missing pickles raise `FileNotFoundError` (surfaced as HTTP 500 on `/assess`). There is **no heuristic fallback**.

SQLite uses `check_same_thread=False`. Timestamps are stored as naive UTC; query `since`/`until` strings are parsed to naive UTC to avoid empty history filters.

---

## 2. REST API specification

Base URL: `http://127.0.0.1:8000`

### 2.1 `POST /api/v1/telemetry/assess`

Primary ingestion and inference route.

**Request body (`TelemetryPayload`)**

| Field | Type | Required | Example |
|-------|------|----------|---------|
| `hostname` | string | yes | `DESKTOP-MSU-LAB01` |
| `snapshot_label` | string | yes | `SYSTEM_SNAPSHOT` |
| `accessible_processes` | int | yes | `120` |
| `pslist_nproc` | int | yes | `140` |
| `pslist_nppid` | int | yes | `48` |
| `pslist_avg_threads` | float | yes | `12.4` |
| `pslist_avg_handlers` | float | yes | `248.0` |
| `dlllist_ndlls` | int | yes | `2100` |
| `dlllist_avg_dlls_per_proc` | float | yes | `46.5` |
| `handles_nhandles` | int | yes | `12000` |
| `handles_avg_handles_per_proc` | float | yes | `260.0` |
| `pid` | int | no | `0` (stored when omitted) |
| `behavioural_level` | string | no | `SAFE`, `MEDIUM`, `HIGH`, or `CRITICAL` |
| `behavioural_score` | int | no | `95` |
| `behavioural_reasons` | string[] | no | rename and rewrite notes |
| `modify_rate`, `rename_rate` | float | no | file-activity rates |
| `suspicious_renames` | int | no | count in the monitor window |
| `timestamp` | string | no | ISO-8601 (default now) |

`snapshot_label` is stored in the existing `process_name` column. Per-process columns (`cpu_percent`, `memory_mb`, `thread_count`, `open_handles`, `loaded_modules`) are left null.

**Success:** `200` `AssessmentResponse`

| Field | Type | Notes |
|-------|------|--------|
| `telemetry_id` | int | SQLite `AssessmentRecord.id` |
| `snapshot_label`, `pid`, `hostname` | | Echo of input. `pid` is 0 for system snapshots |
| `prediction` | string | Model label, or a threat label when the behavioural monitor wins |
| `confidence` | float | Memory-model confidence |
| `risk_score` | int | Final score after combining the two signals |
| `severity` | string | Final severity: `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL` |
| `model_severity`, `model_risk_score` | | Memory-model result before the combine step |
| `behavioural_level`, `behavioural_score`, `behavioural_reasons` | | File-activity signal from this request |
| `triggered_by` | string | `memory_model` or `behavioural` |
| `top_shap_features` | `SHAPImpact[]` | `{ feature, impact }` for the memory model |
| `harmonized_vector` | object | Eight CIC keys. Stored JSON also holds `__behavioural_*` markers |
| `recommendation` | string | Text written at assess time. The analysis page replaces the display with a shorter action note |
| `timestamp` | string | ISO time of persist |

**Error:** `500` `{ "detail": "<exception>" }` if harmonize/predict/SHAP/DB fails. `422` on Pydantic validation failure.

**Severity bands** (`PredictionService`): risk ≥ 80 CRITICAL, ≥ 60 HIGH, ≥ 30 MEDIUM, else LOW. The behavioural level `SAFE` maps to `LOW`. The stored severity is the higher of the two ranks.

### 2.1.1 Demo control

Local demonstration only.

| Method | Path | Result |
|--------|------|--------|
| `POST` | `/api/v1/demo/simulate-ransomware?duration=30` | Starts `agent/ransomware_simulator.py`. Duration is clamped to 5..120 seconds. `409` if one is already running |
| `GET` | `/api/v1/demo/status` | `{ "running": true/false }` |

The simulator writes only under `aegis-backend/watch_target`, uses a reversible byte flip rather than encryption, and deletes those files on exit.

---

### 2.2 `GET /api/v1/telemetry/recent`

| Query | Type | Default | Constraints |
|-------|------|---------|-------------|
| `limit` | int | 20 | 1..50 |

**Success:** `200` JSON array of `AssessmentRecordOut` (newest first). Includes `harmonized_vector` and telemetry columns.

---

### 2.3 `GET /api/v1/telemetry/assessment/{id_or_pid}`

Path parameter `id_or_pid`: digits only.

1. Lookup `AssessmentRecord.id == n`.
2. Else latest row with `pid == n`.

| Status | Body |
|--------|------|
| `200` | `AssessmentRecordOut` |
| `400` | `id_or_pid must be a numeric assessment id or PID` |
| `404` | `No assessment found for id or pid {n}` |

---

### 2.4 `GET /api/v1/telemetry/history`

| Query | Type | Default | Notes |
|-------|------|---------|--------|
| `severity` | string | omitted | Aliases: Safe→LOW, Moderate→MEDIUM, High→HIGH, Critical→CRITICAL; also LOW/MEDIUM/HIGH/CRITICAL. `ALL` ignored. Unknown → `400` |
| `search` | string | omitted | `ILIKE` process_name / hostname; exact PID if digits |
| `since` | ISO-8601 | omitted | Inclusive lower bound |
| `until` | ISO-8601 | omitted | Inclusive upper bound |
| `from_date` | ISO-8601 | | Alias of `since` |
| `until_date` | ISO-8601 | | Alias of `until` |
| `page` | int | 1 | ≥ 1 |
| `page_size` | int | 50 | 1..200 |

**Success:** `200` `HistoryResponse`

```json
{
  "items": [ ],
  "total": 7,
  "total_count": 7,
  "page": 1,
  "page_size": 50
}
```

`total` and `total_count` are the same integer (filter cardinality).

---

### 2.5 `GET /api/v1/telemetry/metrics`

**Success:** `200` `MetricsResponse`

| Field | Meaning |
|-------|---------|
| `total_scanned` | Count of rows |
| `threats_detected` | `severity IN ('HIGH','CRITICAL')` |
| `safe_processes` | `severity == 'LOW'` |
| `avg_risk_score` | Mean `risk_score` |
| `latest_timestamp` | Max timestamp, ISO with offset |
| `severity_counts` | `{ LOW, MEDIUM, HIGH, CRITICAL }` |

---

### 2.6 `GET /api/v1/analytics/research-benchmark`

**Success:** `200` raw JSON of `app/ml/training_metrics.json`.

**Error:** `404` if the file is missing; `500` if JSON is invalid.

---

### 2.7 `GET /health` and `GET /api/v1/health`

Used by the frontend for gateway latency (`performance.now()` around the request).

**Success:** `200` `HealthResponse`

```json
{
  "status": "online",
  "timestamp": "2026-08-25T18:00:00+00:00",
  "db_connected": true,
  "service": "FastAPI AegisAI Engine",
  "version": "1.0.0"
}
```

`status` is `degraded` if `SELECT 1` on SQLite fails; `db_connected` is then `false`.

Interactive OpenAPI: http://127.0.0.1:8000/docs

---

## 3. Database schema (`AssessmentRecord`)

Table: `assessment_records`  
File: `app/data/aegisai.db`

| Column | SQLAlchemy | Index | Notes |
|--------|------------|-------|--------|
| `id` | Integer PK autoincrement | PK | Returned as `telemetry_id` / `AssessmentRecordOut.id` |
| `timestamp` | DateTime | yes | Naive UTC at insert |
| `hostname` | String(255) | yes | |
| `process_name` | String(255) | yes | Stores `snapshot_label` |
| `pid` | Integer | yes | `0` for system snapshots |
| `prediction` | String(64) | | Human label |
| `confidence` | Float | | |
| `risk_score` | Integer | | 0..100 |
| `severity` | String(32) | yes | LOW/MEDIUM/HIGH/CRITICAL |
| `top_shap_features` | Text | | JSON array of `{feature, impact}` |
| `recommendation` | Text | | |
| `harmonized_vector` | Text nullable | | Eight CIC floats plus `__behavioural_*` markers |
| `cpu_percent` | Float nullable | | Unused by the system-wide agent |
| `memory_mb` | Float nullable | | Unused |
| `thread_count` | Integer nullable | | Unused |
| `open_handles` | Integer nullable | | Unused |
| `loaded_modules` | Integer nullable | | Unused |

If older rows have a null `harmonized_vector`, the API still returns the stored assessment fields. New rows always persist the eight-feature object plus the behavioural markers.

---

## 4. Endpoint agent (`agent/endpoint_agent.py`)

Lightweight collector. **No `requests` dependency**; uses `urllib.request`. One POST per cycle.

| Item | Default |
|------|---------|
| API | `AEGIS_API_URL` or `http://127.0.0.1:8000` |
| Interval | `AEGIS_AGENT_INTERVAL` or `3` seconds |
| Snapshot label | `SYSTEM_SNAPSHOT` |

**Collection**

1. Walk accessible processes and skip `AccessDenied`, `NoSuchProcess`, `ZombieProcess`, and `OSError`.
2. Aggregate process, thread, DLL, and handle totals into the eight payload counters.
3. POST one snapshot to `/api/v1/telemetry/assess`.

The file-activity monitor can add `behavioural_level`, `behavioural_score`, and `behavioural_reasons` on that same payload. `agent/ransomware_simulator.py` is the contained demo that produces those file events. It writes only inside `watch_target`.

**CLI**

```bash
python agent/endpoint_agent.py
python agent/endpoint_agent.py --once
python agent/endpoint_agent.py --api-url http://127.0.0.1:8000 --interval 3
python agent/ransomware_simulator.py 30
```

Run from `aegis-backend/`.
