# AegisAI

Explainable hybrid ransomware detection for a BSc Data Science dissertation: FastAPI inference with Random Forest + XGBoost + SHAP, a Next.js examiner console, and a lightweight psutil endpoint agent.

## Layout

- `aegis-backend/` — FastAPI gateway, ML artifacts, SQLite persistence, endpoint agent
- `Aegis.AI/` — Next.js 13 App Router frontend

## Run locally

**Backend** (Python 3.11+):

```bash
cd aegis-backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Optional: copy `.env.example` to `.env`. Retraining needs `data/raw/Obfuscated-MalMem2022.csv` (CIC-MalMem-2022). Inference uses the pickles already in `app/ml/`.

**Frontend**:

```bash
cd Aegis.AI
cp .env.example .env.local
npm install
npm run dev
```

UI: http://localhost:3000 · API: http://127.0.0.1:8000
