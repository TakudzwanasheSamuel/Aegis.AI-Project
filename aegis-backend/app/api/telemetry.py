import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import crud
from app.database.models import AssessmentRecord
from app.database.session import get_db
from app.schemas.telemetry import (
    AssessmentRecordOut,
    AssessmentResponse,
    HistoryResponse,
    MetricsResponse,
    SHAPImpact,
    TelemetryPayload,
)
from app.services.harmonization_service import FeatureHarmonizationService
from app.services.prediction_service import PredictionService
from app.services.shap_service import SHAPExplainabilityService

router = APIRouter(prefix="/api/v1/telemetry", tags=["Telemetry & Threats"])
predictor = PredictionService()
shap_explainer = SHAPExplainabilityService()

SEVERITY_ALIASES = {
    "SAFE": "LOW",
    "LOW": "LOW",
    "MODERATE": "MEDIUM",
    "MEDIUM": "MEDIUM",
    "HIGH": "HIGH",
    "CRITICAL": "CRITICAL",
}
SEVERITY_RANK = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
BEHAV_TO_SEVERITY = {"SAFE": "LOW", "MEDIUM": "MEDIUM", "HIGH": "HIGH", "CRITICAL": "CRITICAL"}


def _combine_verdicts(model_severity, model_risk, behav_level, behav_score):
    """Final verdict is the more severe of the memory model and the behavioural monitor."""
    behav_sev = BEHAV_TO_SEVERITY.get((behav_level or "SAFE").upper(), "LOW")
    model_rank = SEVERITY_RANK.get(model_severity, 0)
    behav_rank = SEVERITY_RANK.get(behav_sev, 0)
    if behav_rank > model_rank:
        return behav_sev, int(behav_score or 0), "behavioural"
    if model_rank > behav_rank:
        return model_severity, int(model_risk), "memory_model"
    if int(behav_score or 0) > int(model_risk):
        return behav_sev, int(behav_score or 0), "behavioural"
    return model_severity, int(model_risk), "memory_model"


def _as_utc(value: datetime | None) -> datetime:
    if value is None:
        return datetime.now(timezone.utc)
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _iso(value: datetime | None) -> str:
    return _as_utc(value).isoformat()


def _parse_iso(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return _as_utc(parsed).replace(tzinfo=None)


def serialize_record(record: AssessmentRecord) -> AssessmentRecordOut:
    try:
        shap_raw = json.loads(record.top_shap_features or "[]")
    except json.JSONDecodeError:
        shap_raw = []
    shap_features = [
        SHAPImpact(feature=item.get("feature", "unknown"), impact=float(item.get("impact", 0.0)))
        for item in shap_raw
        if isinstance(item, dict)
    ]

    harmonized: dict[str, float] = {}
    behav_level = None
    behav_score = None
    triggered_by = None
    if record.harmonized_vector:
        try:
            parsed = json.loads(record.harmonized_vector)
            if isinstance(parsed, dict):
                rank_to_sev = {0: "LOW", 1: "MEDIUM", 2: "HIGH", 3: "CRITICAL"}
                for key, value in parsed.items():
                    if key == "__behavioural_level":
                        behav_level = rank_to_sev.get(int(value), "LOW")
                    elif key == "__behavioural_score":
                        behav_score = int(value)
                    elif key == "__triggered_by":
                        triggered_by = "behavioural" if float(value) >= 1.0 else "memory_model"
                    else:
                        harmonized[str(key)] = float(value)
        except (json.JSONDecodeError, TypeError, ValueError):
            harmonized = {}
    return AssessmentRecordOut(
        id=record.id,
        timestamp=_iso(record.timestamp),
        hostname=record.hostname,
        snapshot_label=record.process_name,
        pid=record.pid,
        prediction=record.prediction,
        confidence=record.confidence,
        risk_score=record.risk_score,
        severity=record.severity,
        top_shap_features=shap_features,
        recommendation=record.recommendation,
        harmonized_vector=harmonized or None,
        behavioural_level=behav_level,
        behavioural_score=behav_score,
        triggered_by=triggered_by,
    )


@router.post("/assess", response_model=AssessmentResponse)
async def assess_telemetry(payload: TelemetryPayload, db: Session = Depends(get_db)):
    try:
        telemetry_dict = payload.model_dump()
        harmonized = FeatureHarmonizationService.harmonize(telemetry_dict)
        prediction, confidence, risk_score, severity = predictor.predict(harmonized)
        scaled = predictor.scale(harmonized)
        shap_features = shap_explainer.calculate_shap_values(scaled)

        behav_level = payload.behavioural_level or "SAFE"
        behav_score = int(payload.behavioural_score or 0)
        behav_reasons = payload.behavioural_reasons or []

        final_severity, final_risk, triggered_by = _combine_verdicts(
            severity, risk_score, behav_level, behav_score
        )

        if triggered_by == "behavioural":
            prediction = "Critical Threat" if final_severity == "CRITICAL" else "Threat Detected"
            recommendation = (
                "CRITICAL: Ransomware-like file activity detected on the endpoint "
                f"({'; '.join(behav_reasons) if behav_reasons else 'high file rewrite and rename rate'}). "
                "Isolate the endpoint and inspect the responsible process."
            )
        elif final_severity == "CRITICAL":
            recommendation = (
                "CRITICAL: Memory pattern matches the malicious profile. "
                "Investigate the endpoint and review SHAP contributors."
            )
        elif final_severity == "HIGH":
            recommendation = (
                "WARNING: Suspicious activity detected. "
                "Investigate the process executable and file activity."
            )
        elif final_severity == "MEDIUM":
            recommendation = (
                "CAUTION: Endpoint is outside the benign baseline. Continue monitoring."
            )
        else:
            recommendation = (
                "SAFE: Endpoint operating within normal behavioral baseline parameters."
            )

        stored_vector = dict(harmonized)
        stored_vector["__behavioural_level"] = float(
            SEVERITY_RANK.get(BEHAV_TO_SEVERITY.get(behav_level.upper(), "LOW"), 0)
        )
        stored_vector["__behavioural_score"] = float(behav_score)
        stored_vector["__triggered_by"] = 1.0 if triggered_by == "behavioural" else 0.0

        record = crud.create_assessment(
            db,
            AssessmentRecord(
                timestamp=datetime.now(timezone.utc).replace(tzinfo=None),
                hostname=payload.hostname,
                process_name=payload.snapshot_label,
                pid=payload.pid or 0,
                prediction=prediction,
                confidence=confidence,
                risk_score=final_risk,
                severity=final_severity,
                top_shap_features=json.dumps(shap_features),
                recommendation=recommendation,
                harmonized_vector=json.dumps(stored_vector),
            ),
        )

        return AssessmentResponse(
            telemetry_id=record.id,
            snapshot_label=payload.snapshot_label,
            pid=payload.pid or 0,
            prediction=prediction,
            confidence=confidence,
            risk_score=final_risk,
            severity=final_severity,
            top_shap_features=[SHAPImpact(**feature) for feature in shap_features],
            harmonized_vector=harmonized,
            recommendation=recommendation,
            hostname=payload.hostname,
            timestamp=_iso(record.timestamp),
            model_severity=severity,
            model_risk_score=risk_score,
            behavioural_level=behav_level,
            behavioural_score=behav_score,
            behavioural_reasons=behav_reasons,
            triggered_by=triggered_by,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/assessment/{id_or_pid}", response_model=AssessmentRecordOut)
def get_assessment(id_or_pid: str, db: Session = Depends(get_db)):
    if not id_or_pid.isdigit():
        raise HTTPException(status_code=400, detail="id_or_pid must be a numeric assessment id or PID")
    numeric = int(id_or_pid)
    record = crud.get_by_id(db, numeric)
    if record is None:
        record = crud.get_latest_by_pid(db, numeric)
    if record is None:
        raise HTTPException(status_code=404, detail=f"No assessment found for id or pid {numeric}")
    return serialize_record(record)


@router.get("/recent", response_model=list[AssessmentRecordOut])
def get_recent_assessments(
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    return [serialize_record(record) for record in crud.list_recent(db, limit=limit)]


@router.get("/history", response_model=HistoryResponse)
def get_assessment_history(
    severity: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    since: Optional[str] = Query(None, description="Inclusive start timestamp (ISO-8601)"),
    until: Optional[str] = Query(None, description="Inclusive end timestamp (ISO-8601)"),
    from_date: Optional[str] = Query(None, description="Alias for since"),
    until_date: Optional[str] = Query(None, description="Alias for until"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    mapped_severity = None
    if severity:
        mapped_severity = SEVERITY_ALIASES.get(severity.strip().upper())
        if severity.strip().upper() not in {"ALL", ""} and mapped_severity is None:
            raise HTTPException(status_code=400, detail=f"Unknown severity filter: {severity}")

    since_dt = _parse_iso(since or from_date)
    until_dt = _parse_iso(until or until_date)

    items, total = crud.list_history(
        db,
        severity=mapped_severity,
        search=search,
        since=since_dt,
        until=until_dt,
        page=page,
        page_size=page_size,
    )
    return HistoryResponse(
        items=[serialize_record(record) for record in items],
        total=total,
        total_count=total,
        page=page,
        page_size=page_size,
    )


@router.get("/metrics", response_model=MetricsResponse)
def get_telemetry_metrics(db: Session = Depends(get_db)):
    return MetricsResponse(**crud.get_metrics(db))
