# AegisAI

**An Explainable Hybrid Behavioral Ransomware Detection and Threat Analytics Framework Using Memory Forensic Intelligence and Endpoint Telemetry**

Midlands State University, Faculty of Business Sciences  
BSc Honours Data Science dissertation system

---

## 1. Executive summary and project abstract

AegisAI is an explainable hybrid detection platform that scores live Windows endpoints for ransomware-like behaviour without a full memory dump at inference time. Offline, Random Forest and XGBoost are trained on eight CIC-MalMem-2022 system-wide indicators (58,062 samples: 29,231 benign and 28,831 malware). Online, the endpoint agent posts one system-wide snapshot per cycle. A Feature Harmonization Layer copies those eight counters into the model feature names. The ensemble malware probability is the mean of the two classifiers. `shap.TreeExplainer` on the Random Forest explains that memory-model score.

A second signal watches file rewrites and renames. The final severity is the more severe of the memory model and the behavioural monitor. Results persist in SQLite (`assessment_records`) and are shown in a Next.js 13 decision-support console.

The system is **decision-support only**. It does not isolate hosts, stop processes, or take backups. The analysis page writes a plain-language recommendation from the detector that fired.

---

## 2. High-level architecture

```
 +------------------+     POST /api/v1/telemetry/assess      +---------------------------+
 | Endpoint Agent   | -------------------------------------> | FastAPI REST Gateway      |
 | agent/           |     TelemetryPayload (JSON)            | uvicorn :8000             |
 | endpoint_agent.py|                                        | CORS allow_origins=["*"]  |
 | (psutil)         |                                        +-------------+-------------+
 +------------------+                                                      |
         ^                                                                 v
         |                                                    +---------------------------+
         |  one SYSTEM_SNAPSHOT per cycle:                    | Feature Harmonization     |
         |  process, thread, DLL, and handle totals           | Layer (pass-through)      |
         |  plus optional file-activity fields                | 8 CIC columns             |
         |                                                    +-------------+-------------+
 +------------------+                                                      |
 | Scenario Sandbox |  same POST contract                                  v
 | /sandbox         |                                         +---------------------------+
 +------------------+                                         | Ensemble ML               |
                                                              | RF + XGBoost mean P(mal)  |
                                                              | SHAP TreeExplainer (RF)   |
                                                              +-------------+-------------+
                                                                            |
                                                                            v
                                                              +---------------------------+
                                                              | SQLite / SQLAlchemy       |
                                                              | app/data/aegisai.db       |
                                                              | assessment_records        |
                                                              +-------------+-------------+
                                                                            |
         GET /health, /metrics, /recent, /history, /assessment/{id_or_pid}  |
         GET /api/v1/analytics/research-benchmark                           v
                                                              +---------------------------+
                                                              | Next.js Decision-Support  |
                                                              | Dashboard (localhost:3000)|
                                                              | /dashboard /analysis      |
                                                              | /history /sandbox /research|
                                                              +---------------------------+
```

**Inference path (code):** `POST /assess` → `FeatureHarmonizationService.harmonize()` → `PredictionService.predict()` → `SHAPExplainabilityService.calculate_shap_values()` → `_combine_verdicts()` with the optional behavioural level → `crud.create_assessment()` → `AssessmentResponse`.

A local demo control route, `POST /api/v1/demo/simulate-ransomware`, starts `agent/ransomware_simulator.py`. That script only rewrites files inside `aegis-backend/watch_target` and deletes them when it finishes. It is not real encryption.

---

## 3. Key innovations

### 3.1 Feature Harmonization Layer

The live model uses these eight CIC-MalMem-2022 names, in order: `pslist.nproc`, `pslist.nppid`, `pslist.avg_threads`, `pslist.avg_handlers`, `dlllist.ndlls`, `dlllist.avg_dlls_per_proc`, `handles.nhandles`, `handles.avg_handles_per_proc`.

The agent aggregates accessible processes into one snapshot (`snapshot_label`, usually `SYSTEM_SNAPSHOT`). Harmonization renames the payload fields to those dotted names. It does not interpolate class centroids.

### 3.2 Hybrid verdict

Optional payload fields `behavioural_level`, `behavioural_score`, and `behavioural_reasons` come from the file-activity monitor. `_combine_verdicts` keeps the more severe of the memory-model severity and the behavioural level. `triggered_by` is `memory_model` or `behavioural`.

No new database columns were added. The behavioural level, score, and which detector fired are stored as numeric markers inside the existing `harmonized_vector` JSON (`__behavioural_level`, `__behavioural_score`, `__triggered_by`). The reason strings are joined into the stored `recommendation` text.

### 3.3 Decision-support explainable AI

Every persisted assessment stores `prediction`, `confidence`, `risk_score`, `severity`, `top_shap_features`, `harmonized_vector`, and `recommendation`. The `/analysis` page shows SHAP when the memory model produced the verdict, and file-activity bullets when the behavioural monitor did. Isolation, process-tree, and backup actions are **out of scope**.

---

## 4. System overview and repository structure

Workspace root: `D:\Aegis.AI Project`

```
Aegis.AI Project/
├── README.md                          # This document
├── USER_MANUAL_AND_SETUP_GUIDE.md     # Install, run, viva demonstration
├── .gitignore
├── aegis-backend/                     # FastAPI microservice + agent + ML
│   ├── README.md
│   ├── requirements.txt
│   ├── train_models.py
│   ├── export_eval_metrics.py
│   ├── agent/endpoint_agent.py
│   ├── agent/ransomware_simulator.py  # contained watch_target demo
│   ├── agent/file_activity_monitor.py
│   ├── app/
│   │   ├── main.py
│   │   ├── api/telemetry.py           # assess, recent, history, metrics, assessment
│   │   ├── api/analytics.py           # research-benchmark
│   │   ├── api/demo.py                # simulate-ransomware, status
│   │   ├── database/models.py         # AssessmentRecord
│   │   ├── database/session.py        # SQLite aegisai.db
│   │   ├── schemas/telemetry.py       # TelemetryPayload, AssessmentResponse, ...
│   │   ├── services/                  # harmonization, prediction, SHAP
│   │   ├── ml/                        # *.pkl, training_metrics.json
│   │   └── data/aegisai.db            # created at runtime (gitignored)
│   └── data/raw/                      # Obfuscated-MalMem2022.csv (local, gitignored)
└── Aegis.AI/                          # Next.js 13.5.1 App Router frontend
    ├── README.md
    ├── app/                           # routes: /, dashboard, analysis, history, sandbox, research
    ├── components/
    ├── lib/api.ts                     # NEXT_PUBLIC_API_URL client
    └── .env.example
```

The Next.js tree may also be pushed as its own GitHub repository (`Aegis.AI`). Keep both folders on disk for a full local demonstration.

---

## 5. Quickstart summary

| Step | Command | Result |
|------|---------|--------|
| 1 | `cd aegis-backend` then `python -m venv venv` and `pip install -r requirements.txt` | Python dependencies |
| 2 | Confirm `app/ml/random_forest.pkl`, `xgboost.pkl`, `scaler.pkl`, `shap_background.pkl` | Inference artifacts |
| 3 | `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload` | Gateway + SQLite init |
| 4 | `cd Aegis.AI`, copy `.env.example` to `.env.local`, `npm install`, `npm run dev` | UI at http://localhost:3000 |
| 5 | `python agent/endpoint_agent.py --once` (from `aegis-backend`) | One system-wide snapshot |

Full walkthrough: [USER_MANUAL_AND_SETUP_GUIDE.md](USER_MANUAL_AND_SETUP_GUIDE.md).  
API contract: [aegis-backend/README.md](aegis-backend/README.md).  
ML and SHAP: [aegis-backend/app/ml/MODEL_DOCUMENTATION.md](aegis-backend/app/ml/MODEL_DOCUMENTATION.md).  
Frontend: [Aegis.AI/README.md](Aegis.AI/README.md).

**High-level execution sequence**

1. Train (optional): `train_models.py` writes pickles and `training_metrics.json`.
2. Serve: FastAPI loads pickles at import time (`PredictionService`, `SHAPExplainabilityService`).
3. Collect: the agent posts one system snapshot, or the sandbox posts a preset payload. The dashboard can also start the contained file simulator.
4. Harmonize, ensemble-score, explain, combine with the behavioural signal, persist.
5. Poll: dashboard every 3 seconds (`/metrics`, `/recent`); header health every 5 seconds (`/health`). The large status follows the newest row, not the lifetime threat count.

---

## 6. Academic and research context

This platform is the software artefact for a BSc Honours Data Science dissertation at **Midlands State University, Faculty of Business Sciences** (Department of Data Science and Informatics). It demonstrates:

- Reproducible supervised learning on a public memory-forensic benchmark (CIC-MalMem-2022).
- A documented mapping from live endpoint telemetry to that forensic feature space.
- Post-hoc tree explainability suitable for examiner audit (`TreeExplainer` on the production Random Forest).
- An end-to-end operator console that consumes **live** FastAPI JSON, not static mock tables, for the six App Router pages.

Held-out scores in `app/ml/training_metrics.json` (58,062 samples, 8 features): Random Forest accuracy **0.9995**, F1 **0.9995**, ROC-AUC **1.0000**; XGBoost accuracy **0.9996**, F1 **0.9996**, ROC-AUC **1.0000**. Near-perfect benchmark accuracy reflects dataset separability. Live performance is evaluated separately. The loaded scaler is a pass-through (`FunctionTransformer`), not a fitted `StandardScaler`.
