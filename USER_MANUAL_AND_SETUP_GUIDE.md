# AegisAI user manual and setup guide

This document is the examiner-facing install and demonstration script for the workspace at `D:\Aegis.AI Project`. Commands assume **Windows 10/11 x64** and **PowerShell**. Paths below are relative to that workspace unless noted.

Companion documents:

| Document | Location |
|----------|----------|
| Project abstract and architecture | `README.md` |
| Frontend console | `Aegis.AI/README.md` |
| REST API, SQLite, agent | `aegis-backend/README.md` |
| CIC training, harmonization, SHAP | `aegis-backend/app/ml/MODEL_DOCUMENTATION.md` |

---

## 1. Prerequisites and environment requirements

| Requirement | Minimum | Notes |
|-------------|---------|--------|
| Operating system | Windows 10 or 11, 64-bit | `psutil` handle counts use `num_handles()` on Windows |
| Python | 3.10 or newer | Verified with a virtual environment under `aegis-backend/venv` |
| Node.js | 18 or newer (LTS) | Next.js 13.5.1 App Router |
| npm | Bundled with Node.js | `npm install` in `Aegis.AI/` |
| Git | Optional | Needed only if cloning rather than using a local copy |
| RAM / disk | ~4 GB RAM, ~1 GB free | CIC CSV is about 19 MB; pickles are already in `app/ml/` |

Confirm versions:

```powershell
python --version
node --version
npm --version
```

Open **three** PowerShell windows for a live demo: (1) FastAPI, (2) Next.js, (3) endpoint agent.

Default ports:

| Service | Port | URL |
|---------|------|-----|
| FastAPI / Uvicorn | 8000 | http://127.0.0.1:8000 |
| Next.js | 3000 | http://localhost:3000 |
| OpenAPI docs | 8000 | http://127.0.0.1:8000/docs |

Use `127.0.0.1` in `NEXT_PUBLIC_API_URL` so the browser and agent hit the same origin as the gateway bind address.

---

## 2. Complete installation walkthrough

### 2.1 Backend virtual environment and dependencies

```powershell
cd "D:\Aegis.AI Project\aegis-backend"
python -m venv venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Expected packages include FastAPI, Uvicorn, Pydantic v2, SQLAlchemy, scikit-learn, XGBoost, SHAP, imbalanced-learn, pandas, numpy, joblib, and psutil (`wmi` installs only on Windows).

Leave this shell activated for training, Uvicorn, and the agent.

### 2.2 Model training or artifact verification

Inference requires these files under `aegis-backend/app/ml/`:

| Artifact | Role |
|----------|------|
| `random_forest.pkl` | Ensemble member and SHAP TreeExplainer model |
| `xgboost.pkl` | Ensemble member |
| `scaler.pkl` | `StandardScaler` fit on the SMOTE train fold |
| `feature_names.pkl` | Ordered list of the 8 CIC columns |
| `shap_background.pkl` | 64 scaled background rows for interventional SHAP |
| `training_metrics.json` | Held-out scores consumed by `GET /api/v1/analytics/research-benchmark` |

**If those files already exist** (they are tracked in this workspace), skip retraining and continue to section 2.3.

**To retrain** you need the CIC dump at `aegis-backend/data/raw/Obfuscated-MalMem2022.csv` (gitignored, ~19 MB):

```powershell
cd "D:\Aegis.AI Project\aegis-backend"
.\venv\Scripts\Activate.ps1
python train_models.py
```

`train_models.py` uses `HARMONIZED_FEATURES` (8 columns), an 80/20 stratified split (`random_state=42`), SMOTE on the train fold, `StandardScaler`, `RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)`, and `XGBClassifier(n_estimators=100, learning_rate=0.1, random_state=42, eval_metric="logloss")`. It overwrites the pickles and `training_metrics.json`.

Optional: recompute confusion / ROC / importance JSON without refitting:

```powershell
python export_eval_metrics.py
```

There is **no heuristic fallback**. If pickles are missing, `POST /api/v1/telemetry/assess` returns HTTP 500 with a `FileNotFoundError` detail.

### 2.3 Backend server launch

From `aegis-backend` with the venv active:

```powershell
cd "D:\Aegis.AI Project\aegis-backend"
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Equivalent form (if `Scripts` is on `PATH`):

```powershell
uvicorn app.main:app --reload --port 8000 --host 127.0.0.1
```

On startup `init_db()` creates `app/data/aegisai.db` and adds `harmonized_vector` if the table predates that column.

Verify:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

Expected JSON shape (`HealthResponse`):

```json
{
  "status": "online",
  "timestamp": "2026-08-25T19:00:00+00:00",
  "db_connected": true,
  "service": "FastAPI AegisAI Engine",
  "version": "1.0.0"
}
```

Leave this process running.

### 2.4 Frontend setup and configuration

In a **second** PowerShell window:

```powershell
cd "D:\Aegis.AI Project\Aegis.AI"
Copy-Item .env.example .env.local
npm install
npm run dev
```

`.env.local` must contain:

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Restart `npm run dev` after any change to `NEXT_PUBLIC_*` (Next inlines those values at boot).

Open http://localhost:3000. The header should show **System Active** and, on medium-and-up viewports, **FastAPI Gateway: Online** with a measured RTT. If it shows **Gateway Unreachable**, see section 4.

Production build (optional):

```powershell
npm run build
npm start
npm run lint
npm run typecheck
```

### 2.5 Live agent execution

In a **third** PowerShell window, same venv as the backend:

```powershell
cd "D:\Aegis.AI Project\aegis-backend"
.\venv\Scripts\Activate.ps1
python agent/endpoint_agent.py
```

Useful flags:

```powershell
python agent/endpoint_agent.py --once
python agent/endpoint_agent.py --api-url http://127.0.0.1:8000 --interval 3 --max-processes 12
```

Environment overrides: `AEGIS_API_URL`, `AEGIS_AGENT_INTERVAL`, `AEGIS_AGENT_MAX_PROCESSES`.

The agent:

1. Iterates processes with `psutil`, primes `cpu_percent`, sleeps 0.15 s.
2. Collects `TelemetryPayload` fields (`hostname`, `process_name`, `pid`, `cpu_percent`, `memory_mb`, `thread_count`, `open_handles`, `loaded_modules`).
3. Skips `AccessDenied`, `NoSuchProcess`, and `ZombieProcess`. Handle and module counts fall back to `0` on those errors.
4. POSTs JSON to `{api}/api/v1/telemetry/assess` via `urllib` (no `requests` package).
5. Prints `severity`, `risk_score`, and `prediction` per PID.

On `/dashboard`, the agent badge reads **Agent Connected / Active Scanning** when `metrics.latest_timestamp` is within 15 seconds.

---

## 3. Examiner demonstration script

Keep Uvicorn and Next.js running. Use Chrome or Edge at http://localhost:3000.

### Scenario 1: Monitor a clean Windows baseline in real time

**Goal:** Show live ingestion of ordinary processes, not ransomware.

1. Start `python agent/endpoint_agent.py` (looping, not `--once`).
2. Open `/dashboard`.
3. Confirm the header **System Active** / **FastAPI Gateway: Online**.
4. Confirm the agent badge is connected (latest assessment younger than 15 s).
5. Watch KPIs (`total_scanned`, `safe_processes`, `avg_risk_score`) increment as `GET /api/v1/telemetry/metrics` and `GET /api/v1/telemetry/recent?limit=20` poll every **3 seconds**.
6. Expect most rows to be `Safe` / `LOW` (chrome, explorer, typical user processes). A busy compiler or browser can still be Safe: the Feature Harmonization Layer does not treat high CPU alone as ransomware.

**Talking point:** The agent emits `TelemetryPayload`. FastAPI harmonizes to eight CIC columns, scores with the RF + XGBoost mean malware probability, explains with `shap.TreeExplainer` on the Random Forest, and inserts an `AssessmentRecord`.

### Scenario 2: Detonate sandbox high-resource and ransomware payloads

**Goal:** Contrast a legitimate heavy workload with the simulated encryptor. Both use the same `POST /api/v1/telemetry/assess` contract as the agent.

Open `/sandbox`.

#### 2a. High-resource (not ransomware)

1. Select **Scenario 2: Resource Intensive Task** (`ffmpeg.exe`, PID `8821`, high CPU/RAM, moderate handles/threads).
2. Optionally move sliders, then click **Send Telemetry to FastAPI Gateway**.
3. Expected outcome: **Safe** / `LOW`. Intensity stays below the 0.55 malfind gate, so `malfind.commitCharge` and `malfind.ninjections` remain on the benign scale.

Do **not** present `ffmpeg.exe` as a ransomware hit. That card exists to show that resource pressure is not sufficient for a Critical verdict.

#### 2b. Simulated ransomware (`encryptor_sim.exe`)

1. Select **Scenario 3: Simulated Ransomware Behavior**.
2. Payload defaults: `process_name=encryptor_sim.exe`, `pid=2345`, `cpu_percent=91`, `memory_mb=1984`, `thread_count=192`, `open_handles=1820`, `loaded_modules=118`, `hostname=SANDBOX-VIVA`.
3. Click **Send Telemetry to FastAPI Gateway**.
4. Expected outcome: **Critical Threat** / `CRITICAL`, high `risk_score` (typically in the 80 to 100 band), a non-empty `top_shap_features` list, and `harmonized_vector` with eight CIC keys.
5. Note `telemetry_id` in the JSON. That integer is `AssessmentRecord.id` and is the `?id=` query for `/analysis`.

Optional: Scenario 1 (`chrome.exe`) is a low-intensity Safe control.

### Scenario 3: Investigate the threat on `/analysis`

**Goal:** Bind a persisted row, interpret SHAP, read the automated recommendation.

1. From `/dashboard`, click the `encryptor_sim.exe` row or **Analyze SHAP** (navigates to `/analysis?id={id}`).
2. Alternatively open `/analysis?id={telemetry_id}` or `/analysis?pid=2345` (PID lookup returns the **latest** row for that PID).
3. Confirm `ProcessTargetHeader` shows `encryptor_sim.exe`, PID, hostname, `prediction`, `risk_score`, `confidence`.
4. Read the horizontal SHAP bar chart: each bar is `{ "feature": "<CIC name>", "impact": <float> }` from `top_shap_features`, ranked by absolute impact. Positive impact supports the malware class; negative supports benign.
5. Read the eight-row feature table: live `psutil` counters versus the harmonized CIC vector (`lib/analysis/harmonization.ts` mirrors backend centroids).
6. Read `recommendation`. For `CRITICAL` the gateway stores:

   `CRITICAL: Ransomware process pattern detected. Immediate endpoint network isolation recommended.`

7. State clearly that this is **decision-support text**. The UI has no isolate, kill, or backup actions.

Use the **Recent assessments** dropdown to switch `?id=` without leaving the page.

### Scenario 4: Audit history and empirical benchmarks

#### 4a. `/history`

1. Open `/history`.
2. Search `encryptor_sim` (300 ms debounce) or PID `2345`.
3. Filter severity **Critical** (mapped to API `CRITICAL`).
4. Use **Last 24 Hours**, **Last 7 Days**, or a custom `since` / `until` range (`until` is the end of the selected day).
5. Open **View Details** for the persisted SHAP vector.
6. Page with Previous / Next (`page_size=25`, `total_count` from `HistoryResponse`).
7. Optionally **Export CSV** or **JSON** of the loaded page.

#### 4b. `/research`

1. Open `/research`.
2. Confirm the table is loaded from `GET /api/v1/analytics/research-benchmark` (file `app/ml/training_metrics.json`), not from hard-coded slides.
3. Report held-out scores on 58,596 CIC samples, 8 features, 80/20 split:

   | Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
   |-------|----------|-----------|--------|-----|---------|
   | Random Forest | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
   | XGBoost | 0.999744 | 0.999829 | 0.999659 | 0.999744 | 0.99999991 |

4. Show confusion matrices, ROC curves, and RF impurity importances.
5. Clarify: these metrics are **dump-row classification** on CIC-MalMem-2022. Live behaviour is a property of the Harmonization Layer plus that model.

---

## 4. Troubleshooting

### 4.1 CORS or "Failed to fetch" in the browser

The gateway sets `CORSMiddleware` with `allow_origins=["*"]`, `allow_methods=["*"]`, `allow_headers=["*"]`. CORS is not the usual blocker.

Check instead:

| Symptom | Cause | Fix |
|---------|--------|-----|
| Header **Gateway Unreachable** | Uvicorn not running or wrong port | Start section 2.3; open http://127.0.0.1:8000/health |
| Mixed host | `.env.local` uses `localhost` while Uvicorn bound `127.0.0.1` (or the reverse) | Set `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000` and restart `npm run dev` |
| Stale env | Changed `.env.local` without restart | Stop Next.js and run `npm run dev` again |
| Browser extension | Aggressive blockers | Try a clean profile or disable the extension |

The client uses `fetch` with `cache: 'no-store'` and no cookies (`lib/api.ts`).

### 4.2 SQLite database is locked

Database file: `aegis-backend/app/data/aegisai.db` (`check_same_thread=False`).

Typical causes:

- DB Browser for SQLite (or another tool) has the file open with a write lock.
- Two Uvicorn processes both writing (leftover `--reload` child plus a second manual start).
- Antivirus briefly locking the file.

Actions:

1. Close GUI database tools.
2. Stop extra Python/Uvicorn processes bound to port 8000.
3. Retry the POST. Do not delete `aegisai.db` during a viva unless you accept losing history.
4. If the file is corrupt, stop Uvicorn, move `aegisai.db` aside, and restart (empty schema via `init_db()`).

`--reload` is convenient for development. For a stable demo, run without `--reload` to avoid a parent/child pair fighting over SQLite.

### 4.3 Missing `.pkl` artifacts

`POST /assess` and process import of `PredictionService` / `SHAPExplainabilityService` require:

```
app/ml/random_forest.pkl
app/ml/xgboost.pkl
app/ml/scaler.pkl
app/ml/feature_names.pkl
app/ml/shap_background.pkl
```

Error text includes `Required SHAP artifacts are missing. Run train_models.py first` or a similar `FileNotFoundError`. Restore the tracked pickles from git, or run `python train_models.py` with the CIC CSV present.

`GET /api/v1/analytics/research-benchmark` returns **404** if `training_metrics.json` is absent.

### 4.4 Port conflicts

| Port | Occupied by | Resolution |
|------|-------------|------------|
| 8000 | Another Uvicorn or unrelated service | `netstat -ano \| findstr :8000` then stop that PID, or `--port 8001` and update `NEXT_PUBLIC_API_URL` plus `AEGIS_API_URL` |
| 3000 | Another Next.js | `npm run dev -- -p 3001` |

Windows example:

```powershell
netstat -ano | findstr :8000
netstat -ano | findstr :3000
```

Do not change FastAPI to a new port without updating `.env.local` and restarting Next.js.

### 4.5 Agent prints "Gateway unreachable"

Uvicorn is down, or `--api-url` / `AEGIS_API_URL` does not match the bind address. Start the gateway first, then the agent.

`HTTP 500` on a PID usually means missing pickles or an exception inside harmonize / predict / SHAP. Read the JSON `detail` field.

`HTTP 422` means the JSON body failed `TelemetryPayload` validation (wrong types or missing fields).

### 4.6 Dashboard search vs history search

Dashboard search filters the **last 20** rows in the browser. History search hits `GET /api/v1/telemetry/history?search=` against SQLite. Use `/history` for audit queries.

### 4.7 Execution policy (venv activate)

If `Activate.ps1` is blocked:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```

Alternatively call `.\venv\Scripts\python.exe` without activating.

---

## 5. Quick reference: execution sequence

```
[1] pip install -r requirements.txt
[2] (optional) python train_models.py
[3] uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
        -> init_db() -> app/data/aegisai.db
[4] npm install && npm run dev          (.env.local -> NEXT_PUBLIC_API_URL)
[5] python agent/endpoint_agent.py      (or /sandbox POST)
        -> TelemetryPayload
        -> Feature Harmonization (8 CIC features)
        -> Ensemble RF + XGBoost
        -> TreeExplainer SHAP
        -> AssessmentRecord
[6] Browser polls /health, /metrics, /recent, /history, /research-benchmark
```

The system does not isolate endpoints or terminate processes. All operator actions after a Critical verdict are human procedures informed by `recommendation` and `top_shap_features`.
