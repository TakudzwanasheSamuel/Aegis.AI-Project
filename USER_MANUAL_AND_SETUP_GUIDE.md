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
| `scaler.pkl` | Pass-through transform. The shipped `training_metrics.json` records scaler as none |
| `feature_names.pkl` | Ordered list of the 8 CIC columns |
| `shap_background.pkl` | Background rows for interventional SHAP |
| `training_metrics.json` | Held-out scores consumed by `GET /api/v1/analytics/research-benchmark` |

**If those files already exist** (they are tracked in this workspace), skip retraining and continue to section 2.3.

**To retrain** you need the CIC dump at `aegis-backend/data/raw/Obfuscated-MalMem2022.csv` (gitignored, ~19 MB):

```powershell
cd "D:\Aegis.AI Project\aegis-backend"
.\venv\Scripts\Activate.ps1
python train_models.py
```

`train_models.py` still applies an 80/20 stratified split, SMOTE, and `StandardScaler`, then overwrites the pickles and `training_metrics.json`. The models already in `app/ml/` were saved without scaling. Skip retraining for the demonstration so those artifacts stay as they are.

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
python agent/endpoint_agent.py --api-url http://127.0.0.1:8000 --interval 3
```

Environment overrides: `AEGIS_API_URL`, `AEGIS_AGENT_INTERVAL`.

The agent:

1. Walks accessible processes with `psutil` and skips `AccessDenied`, `NoSuchProcess`, `ZombieProcess`, and `OSError`.
2. Builds one system-wide snapshot: `hostname`, `snapshot_label` (`SYSTEM_SNAPSHOT`), `accessible_processes`, and the eight process, thread, DLL, and handle counters.
3. POSTs JSON to `{api}/api/v1/telemetry/assess`.
4. Prints `severity`, `risk_score`, and `prediction` for that snapshot.

On `/dashboard`, the agent badge reads **Agent Connected / Active Scanning** when `metrics.latest_timestamp` is within 15 seconds.

To show the file-activity detector, start the contained simulator in a fourth window (or use **Start Live Simulation** on `/sandbox`):

```powershell
python agent/ransomware_simulator.py 30
```

It only rewrites disposable files inside `aegis-backend/watch_target` and deletes them when it exits.

---

## 3. Examiner demonstration script

Keep Uvicorn and Next.js running. Use Chrome or Edge at http://localhost:3000.

### Scenario 1: Monitor a clean Windows baseline in real time

**Goal:** Show live ingestion of ordinary system snapshots.

1. Start `python agent/endpoint_agent.py` (looping, not `--once`).
2. Open `/dashboard`.
3. Confirm the header **System Active** / **FastAPI Gateway: Online**.
4. Confirm the agent badge is connected (latest assessment younger than 15 s).
5. Watch Live Telemetry. `GET /api/v1/telemetry/metrics` and `GET /api/v1/telemetry/recent?limit=20` poll every **3 seconds**. A scan line updates every second.
6. The large status follows the newest row. A normal snapshot reads **Safe**. It switches to **Threat detected** only when that newest row is HIGH or CRITICAL.

**Talking point:** The agent emits one system-wide `TelemetryPayload`. FastAPI copies the eight counters into CIC names, scores them with the RF + XGBoost mean malware probability, explains that score with `shap.TreeExplainer`, and inserts an `AssessmentRecord`.

### Scenario 2: Sandbox presets and the live file simulation

**Goal:** Contrast a normal snapshot, a busy snapshot, and a memory profile in the malware range. Then start the contained file simulator so the behavioural detector can raise the verdict.

Open `/sandbox`.

#### 2a. Preset snapshots

1. **Scenario 1** is a normal snapshot. Expected result: Safe, detector **Memory-forensic model**.
2. **Scenario 2** is a busy machine. Expected result: still Safe. High process and handle counts sit in the benign range of this model.
3. **Scenario 3** uses lower DLL and handle totals. Expected result: a threat from the memory model.
4. **Show advanced controls** reveals sliders and file upload. Those controls only post the eight counters. They do not send file-activity fields.

#### 2b. Live ransomware simulation

1. Click **Start Live Simulation** (30 seconds), or run `python agent/ransomware_simulator.py 30` while the agent is looping.
2. The button stays disabled while `GET /api/v1/demo/status` reports `running: true`. A second start returns HTTP 409.
3. Open `/dashboard` and watch for a row whose detector is the behavioural file-activity monitor.

### Scenario 3: Investigate the threat on `/analysis`

**Goal:** Open a persisted row and read the detector that fired.

1. From `/dashboard`, click the row (navigates to `/analysis?id={id}`).
2. Confirm the header shows hostname, verdict, risk, confidence, and **Detected by**.
3. If the behavioural monitor fired, read **Why this was flagged** (file-activity bullets, level, and score) and the longer recommendation. Open **Memory-model view** only if you want the SHAP chart.
4. If the memory model fired, read the SHAP bars and the eight-row harmonization table.
5. State clearly that the recommendation is **decision-support text**. The UI has no isolate, kill, or backup buttons.

### Scenario 4: History and empirical benchmarks

#### 4a. `/history`

The route is still available at `/history` even though it is not in the primary sidebar.

1. Search by snapshot label or hostname.
2. Filter severity and date range.
3. Open **View Details** for the stored SHAP vector.
4. Page with Previous / Next. Optionally export the loaded page.

#### 4b. `/research`

1. Open `/research`.
2. Confirm the table is loaded from `GET /api/v1/analytics/research-benchmark` (file `app/ml/training_metrics.json`).
3. Report held-out scores on 58,062 samples and 8 features:

   | Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
   |-------|----------|-----------|--------|-----|---------|
   | Random Forest | 0.9995 | 0.9998 | 0.9991 | 0.9995 | 1.0000 |
   | XGBoost | 0.9996 | 1.0000 | 0.9991 | 0.9996 | 1.0000 |

4. Show the confusion counts (XGBoost: TN 5847, FP 0, FN 5, TP 5761) and the feature-importance list. There is no ROC curve in the current JSON.
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
[5] python agent/endpoint_agent.py
        -> one SYSTEM_SNAPSHOT
        -> Feature Harmonization (8 CIC features, pass-through)
        -> Ensemble RF + XGBoost
        -> TreeExplainer SHAP
        -> combine with behavioural file activity when present
        -> AssessmentRecord
[6] Optional: python agent/ransomware_simulator.py 30
        or POST /api/v1/demo/simulate-ransomware?duration=30
[7] Browser polls /health, /metrics, /recent, /history, /research-benchmark
```

The system does not isolate endpoints or terminate processes. The analysis page writes an action note for the analyst. The stored recommendation string is still what the API saved at assess time.



# Terminal 1: restart the backend (must reload the changed code)
cd "D:\Aegis.AI Project\aegis-backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# Terminal 2: agent
cd "D:\Aegis.AI Project\aegis-backend"
python agent/endpoint_agent.py

# Terminal 3: trigger the attack
cd "D:\Aegis.AI Project\aegis-backend"
python agent/ransomware_simulator.py 30