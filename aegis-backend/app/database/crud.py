from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database.models import AssessmentRecord

THREAT_SEVERITIES = ("HIGH", "CRITICAL")


def create_assessment(db: Session, record: AssessmentRecord) -> AssessmentRecord:
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_recent(db: Session, limit: int = 20) -> list[AssessmentRecord]:
    return (
        db.query(AssessmentRecord)
        .order_by(AssessmentRecord.timestamp.desc(), AssessmentRecord.id.desc())
        .limit(max(1, min(limit, 50)))
        .all()
    )


def get_by_id(db: Session, record_id: int) -> Optional[AssessmentRecord]:
    return db.get(AssessmentRecord, record_id)


def get_latest_by_pid(db: Session, pid: int) -> Optional[AssessmentRecord]:
    return (
        db.query(AssessmentRecord)
        .filter(AssessmentRecord.pid == pid)
        .order_by(AssessmentRecord.timestamp.desc(), AssessmentRecord.id.desc())
        .first()
    )


def get_latest_flagged(db: Session) -> Optional[AssessmentRecord]:
    flagged = (
        db.query(AssessmentRecord)
        .filter(AssessmentRecord.severity.in_(("CRITICAL", "HIGH", "MEDIUM")))
        .order_by(AssessmentRecord.timestamp.desc(), AssessmentRecord.id.desc())
        .first()
    )
    if flagged is not None:
        return flagged
    recent = list_recent(db, limit=1)
    return recent[0] if recent else None


def list_history(
    db: Session,
    *,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[AssessmentRecord], int]:
    query = db.query(AssessmentRecord)

    if severity and severity.upper() not in {"ALL", ""}:
        query = query.filter(AssessmentRecord.severity == severity.upper())

    if search:
        term = f"%{search.strip()}%"
        pid_filter = None
        if search.strip().isdigit():
            pid_filter = AssessmentRecord.pid == int(search.strip())
        name_host = or_(
            AssessmentRecord.process_name.ilike(term),
            AssessmentRecord.hostname.ilike(term),
        )
        query = query.filter(or_(name_host, pid_filter) if pid_filter is not None else name_host)

    if since is not None:
        query = query.filter(AssessmentRecord.timestamp >= since)
    if until is not None:
        query = query.filter(AssessmentRecord.timestamp <= until)

    total = query.count()
    page = max(1, page)
    page_size = max(1, min(page_size, 200))
    items = (
        query.order_by(AssessmentRecord.timestamp.desc(), AssessmentRecord.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def get_metrics(db: Session) -> dict:
    total_scanned = db.query(func.count(AssessmentRecord.id)).scalar() or 0
    threats_detected = (
        db.query(func.count(AssessmentRecord.id))
        .filter(AssessmentRecord.severity.in_(THREAT_SEVERITIES))
        .scalar()
        or 0
    )
    safe_processes = (
        db.query(func.count(AssessmentRecord.id))
        .filter(AssessmentRecord.severity == "LOW")
        .scalar()
        or 0
    )
    avg_risk = db.query(func.avg(AssessmentRecord.risk_score)).scalar()
    latest = db.query(func.max(AssessmentRecord.timestamp)).scalar()

    severity_rows = (
        db.query(AssessmentRecord.severity, func.count(AssessmentRecord.id))
        .group_by(AssessmentRecord.severity)
        .all()
    )
    severity_counts = {name: 0 for name in ("LOW", "MEDIUM", "HIGH", "CRITICAL")}
    for name, count in severity_rows:
        severity_counts[str(name)] = int(count)

    latest_iso = None
    if latest is not None:
        stamp = latest
        if getattr(stamp, "tzinfo", None) is None:
            stamp = stamp.replace(tzinfo=timezone.utc)
        latest_iso = stamp.isoformat()

    return {
        "total_scanned": int(total_scanned),
        "threats_detected": int(threats_detected),
        "safe_processes": int(safe_processes),
        "avg_risk_score": float(round(float(avg_risk), 2)) if avg_risk is not None else 0.0,
        "latest_timestamp": latest_iso,
        "severity_counts": severity_counts,
    }
