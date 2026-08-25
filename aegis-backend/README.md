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
  └── router analytics  prefix=/api/v1/analytics

POST /assess pipeline
  TelemetryPayload
    → FeatureHarmonizationService.harmonize
    → PredictionService.predict          # mean(RF, XGB) P(malware)
    → SHAPExplainabilityService          # TreeExplainer on RF
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
| `process_name` | string | yes | `encryptor_sim.exe` |
| `pid` | int | yes | `4032` |
| `cpu_percent` | float | yes | `84.5` |
| `memory_mb` | float | yes | `512.0` |
| `thread_count` | int | yes | `128` |
| `open_handles` | int | yes | `850` |
| `loaded_modules` | int | yes | `45` |
| `timestamp` | string | no | ISO-8601 UTC (default now) |

**Success:** `200` `AssessmentResponse`

| Field | Type | Notes |
|-------|------|--------|
| `telemetry_id` | int | SQLite `AssessmentRecord.id` |
| `process_name`, `pid`, `hostname` | | Echo of input |
| `prediction` | string | `Safe` \| `Moderate Risk` \| `High Risk` \| `Critical Threat` |
| `confidence` | float | Probability of the predicted class, 4 d.p. |
| `risk_score` | int | `round(ensemble_P_malware * 100)` |
| `severity` | string | `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL` |
| `top_shap_features` | `SHAPImpact[]` | `{ feature, impact }`, ranked by `abs(impact)` |
| `harmonized_vector` | object | Eight CIC keys → float |
| `recommendation` | string | Severity-conditioned analyst text |
| `timestamp` | string | ISO UTC of persist |

**Error:** `500` `{ "detail": "<exception>" }` if harmonize/predict/SHAP/DB fails. `422` on Pydantic validation failure.

**Severity bands** (`PredictionService`): risk ≥ 80 CRITICAL, ≥ 60 HIGH, ≥ 30 MEDIUM, else LOW.

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
| `process_name` | String(255) | yes | |
| `pid` | Integer | yes | |
| `prediction` | String(64) | | Human label |
| `confidence` | Float | | |
| `risk_score` | Integer | | 0..100 |
| `severity` | String(32) | yes | LOW/MEDIUM/HIGH/CRITICAL |
| `top_shap_features` | Text | | JSON array of `{feature, impact}` |
| `recommendation` | Text | | |
| `harmonized_vector` | Text nullable | | JSON object of 8 CIC floats |
| `cpu_percent` | Float nullable | | Raw telemetry |
| `memory_mb` | Float nullable | | |
| `thread_count` | Integer nullable | | |
| `open_handles` | Integer nullable | | |
| `loaded_modules` | Integer nullable | | |

If `harmonized_vector` is null on read, `serialize_record` recomputes it from stored psutil columns.

---

## 4. Endpoint agent (`agent/endpoint_agent.py`)

Lightweight collector. **No `requests` dependency**; uses `urllib.request`.

| Item | Default |
|------|---------|
| API | `AEGIS_API_URL` or `http://127.0.0.1:8000` |
| Interval | `AEGIS_AGENT_INTERVAL` or `3` seconds |
| Max processes | `AEGIS_AGENT_MAX_PROCESSES` or `12` (highest CPU then memory) |

**Collection**

1. `psutil.process_iter`: prime `cpu_percent(interval=None)`.
2. Sleep 0.15 s.
3. Per process `oneshot()`: `name`, `pid`, `cpu_percent`, `memory_info().rss` → `memory_mb`, `num_threads`, handles, modules.
4. POST each snapshot to `/api/v1/telemetry/assess`.

**Exception handling**

| Source | Exceptions swallowed / skipped |
|--------|--------------------------------|
| `memory_maps()` | `AccessDenied`, `NoSuchProcess`, `ZombieProcess`, `OSError` → `loaded_modules = 0` |
| `num_handles()` / `num_fds()` | same plus `AttributeError` → `open_handles = 0` |
| `collect_process_payload` | `AccessDenied`, `NoSuchProcess`, `ZombieProcess` → skip process |
| POST | `HTTPError` logged; `URLError` stops the loop ("Gateway unreachable") |

**CLI**

```bash
python agent/endpoint_agent.py
python agent/endpoint_agent.py --once
python agent/endpoint_agent.py --api-url http://127.0.0.1:8000 --interval 3 --max-processes 12
```

Run from `aegis-backend/` so `app` imports are not required (the agent is standalone).
