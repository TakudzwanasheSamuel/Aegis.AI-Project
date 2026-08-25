import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics & Research"])

METRICS_PATH = Path(__file__).resolve().parents[1] / "ml" / "training_metrics.json"


@router.get("/research-benchmark")
def get_research_benchmark():
    if not METRICS_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="training_metrics.json not found. Run train_models.py first.",
        )
    try:
        return json.loads(METRICS_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail="training_metrics.json is invalid JSON") from exc
