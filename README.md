# AegisAI

**An Explainable Hybrid Behavioral Ransomware Detection and Threat Analytics Framework Using Memory Forensic Intelligence and Endpoint Telemetry**

Midlands State University, Faculty of Business Sciences  
BSc Honours Data Science dissertation system

---

## 1. Executive summary and project abstract

AegisAI is an explainable hybrid detection platform that scores live endpoint behaviour for ransomware-like patterns without requiring a full memory dump at inference time. Offline, Random Forest and XGBoost classifiers are trained on an 8-feature subset of the CIC-MalMem-2022 memory-forensic corpus (58,596 samples, balanced 29,298 benign / 29,298 malware). Online, a lightweight `psutil` agent (or the Scenario Sandbox) emits per-process `TelemetryPayload` documents to a FastAPI gateway. A **Feature Harmonization Layer** projects those user-space counters onto the CIC feature manifold. An ensemble of the two classifiers produces a malware probability, risk score, and severity. `shap.TreeExplainer` (Random Forest, interventional, scaled background) returns a ranked `top_shap_features` vector. Results persist in SQLite (`assessment_records`) and are rendered in a Next.js 13 App Router decision-support console.

The system is **decision-support only**. It does not isolate hosts, kill processes, or take backups. Analyst recommendations are strings generated from severity bands.

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
         |  cpu_percent, memory_mb,                           | Feature Harmonization     |
         |  thread_count, open_handles,                       | Layer                     |
         |  loaded_modules                                    | 8 CIC columns             |
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

**Inference path (code):** `POST /assess` → `FeatureHarmonizationService.harmonize()` → `PredictionService.predict()` (scaled RF and XGBoost `predict_proba` average) → `SHAPExplainabilityService.calculate_shap_values()` → `crud.create_assessment()` → `AssessmentResponse`.

---

## 3. Key innovations

### 3.1 Feature Harmonization Layer

CIC-MalMem-2022 columns are **system-wide Volatility dump statistics**, not per-process `psutil` counters. Copying raw handle counts (for example 310) into `handles.nhandles` is out of distribution (CIC `nhandles` is typically thousands). Harmonization computes a bounded **ransom intensity** from live telemetry, then interpolates between class-conditional CIC centroids (`_BENIGN` / `_MALWARE` in `app/services/harmonization_service.py`). `malfind.commitCharge` and `malfind.ninjections` only reach malware-scale values when intensity ≥ 0.55, so a busy but benign workload (sandbox Scenario 2, `ffmpeg.exe`) remains Safe.

### 3.2 Decision-support explainable AI

Every persisted assessment stores:

- `prediction`, `confidence`, `risk_score`, `severity` (`LOW` | `MEDIUM` | `HIGH` | `CRITICAL`)
- `top_shap_features`: JSON list of `{ "feature": "<CIC name>", "impact": <float> }`
- `harmonized_vector`: JSON object of the eight CIC columns
- `recommendation`: severity-conditioned analyst text

The `/analysis` page binds these fields. Isolation, process-tree, and backup actions are **out of scope** and are not implemented as buttons.

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
│   ├── app/
│   │   ├── main.py
│   │   ├── api/telemetry.py           # assess, recent, history, metrics, assessment
│   │   ├── api/analytics.py           # research-benchmark
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
| 5 | `python agent/endpoint_agent.py --once` (from `aegis-backend`) | Live process assessments |

Full walkthrough: [USER_MANUAL_AND_SETUP_GUIDE.md](USER_MANUAL_AND_SETUP_GUIDE.md).  
API contract: [aegis-backend/README.md](aegis-backend/README.md).  
ML and SHAP: [aegis-backend/app/ml/MODEL_DOCUMENTATION.md](aegis-backend/app/ml/MODEL_DOCUMENTATION.md).  
Frontend: [Aegis.AI/README.md](Aegis.AI/README.md).

**High-level execution sequence**

1. Train (optional): `train_models.py` writes pickles and `training_metrics.json`.
2. Serve: FastAPI loads pickles at import time (`PredictionService`, `SHAPExplainabilityService`).
3. Collect: agent or sandbox POST `TelemetryPayload`.
4. Harmonize, ensemble-score, explain, persist.
5. Poll: dashboard every 3 seconds (`/metrics`, `/recent`); header health every 5 seconds (`/health`).

---

## 6. Academic and research context

This platform is the software artefact for a BSc Honours Data Science dissertation at **Midlands State University, Faculty of Business Sciences** (Department of Data Science and Informatics). It demonstrates:

- Reproducible supervised learning on a public memory-forensic benchmark (CIC-MalMem-2022).
- A documented mapping from live endpoint telemetry to that forensic feature space.
- Post-hoc tree explainability suitable for examiner audit (`TreeExplainer` on the production Random Forest).
- An end-to-end operator console that consumes **live** FastAPI JSON, not static mock tables, for the six App Router pages.

Empirical held-out scores (from `app/ml/training_metrics.json`): Random Forest accuracy / precision / recall / F1 / ROC-AUC = **1.0**; XGBoost accuracy **0.9997**, F1 **0.9997**, ROC-AUC **~1.0**. CIC class separation on this eight-column subset is extremely strong. Live sandbox behaviour is governed by the harmonization intensity gate, not by copying CIC row values into `psutil` sliders.
