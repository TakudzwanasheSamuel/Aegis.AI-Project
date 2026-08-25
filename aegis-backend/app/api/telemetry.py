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
    if record.harmonized_vector:
        try:
            parsed = json.loads(record.harmonized_vector)
            if isinstance(parsed, dict):
                harmonized = {str(key): float(value) for key, value in parsed.items()}
        except (json.JSONDecodeError, TypeError, ValueError):
            harmonized = {}
    if not harmonized:
        harmonized = FeatureHarmonizationService.harmonize(
            {
                "cpu_percent": record.cpu_percent or 0.0,
                "memory_mb": record.memory_mb or 0.0,
                "thread_count": record.thread_count or 0,
                "open_handles": record.open_handles or 0,
                "loaded_modules": record.loaded_modules or 0,
            }
        )

    return AssessmentRecordOut(
        id=record.id,
        timestamp=_iso(record.timestamp),
        hostname=record.hostname,
        process_name=record.process_name,
        pid=record.pid,
        prediction=record.prediction,
        confidence=record.confidence,
        risk_score=record.risk_score,
        severity=record.severity,
        top_shap_features=shap_features,
        recommendation=record.recommendation,
        harmonized_vector=harmonized,
        cpu_percent=record.cpu_percent,
        memory_mb=record.memory_mb,
        thread_count=record.thread_count,
        open_handles=record.open_handles,
        loaded_modules=record.loaded_modules,
    )


@router.post("/assess", response_model=AssessmentResponse)
async def assess_telemetry(payload: TelemetryPayload, db: Session = Depends(get_db)):
    try:
        telemetry_dict = payload.model_dump()
        harmonized = FeatureHarmonizationService.harmonize(telemetry_dict)
        prediction, confidence, risk_score, severity = predictor.predict(harmonized)
        scaled = predictor.scale(harmonized)
        shap_features = shap_explainer.calculate_shap_values(scaled)

        if severity == "CRITICAL":
            recommendation = (
                "CRITICAL: Ransomware process pattern detected. "
                "Immediate endpoint network isolation recommended."
            )
        elif severity == "HIGH":
            recommendation = (
                "WARNING: Suspicious handle and thread allocations. "
                "Investigate process executable and parent tree."
            )
        elif severity == "MEDIUM":
            recommendation = (
                "CAUTION: Process is outside the benign baseline. "
                "Continue monitoring and review SHAP contributors."
            )
        else:
            recommendation = (
                "SAFE: Process operating within normal behavioral baseline parameters."
            )

        record = crud.create_assessment(
            db,
            AssessmentRecord(
                timestamp=datetime.now(timezone.utc).replace(tzinfo=None),
                hostname=payload.hostname,
                process_name=payload.process_name,
                pid=payload.pid,
                prediction=prediction,
                confidence=confidence,
                risk_score=risk_score,
                severity=severity,
                top_shap_features=json.dumps(shap_features),
                recommendation=recommendation,
                harmonized_vector=json.dumps(harmonized),
                cpu_percent=payload.cpu_percent,
                memory_mb=payload.memory_mb,
                thread_count=payload.thread_count,
                open_handles=payload.open_handles,
                loaded_modules=payload.loaded_modules,
            ),
        )

        return AssessmentResponse(
            telemetry_id=record.id,
            process_name=payload.process_name,
            pid=payload.pid,
            prediction=prediction,
            confidence=confidence,
            risk_score=risk_score,
            severity=severity,
            top_shap_features=[SHAPImpact(**feature) for feature in shap_features],
            harmonized_vector=harmonized,
            recommendation=recommendation,
            hostname=payload.hostname,
            timestamp=_iso(record.timestamp),
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
