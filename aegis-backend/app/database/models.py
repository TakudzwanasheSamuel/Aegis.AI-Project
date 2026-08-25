from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class AssessmentRecord(Base):
    __tablename__ = "assessment_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False,
    )
    hostname: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    process_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    pid: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    prediction: Mapped[str] = mapped_column(String(64), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False)
    severity: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    top_shap_features: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    recommendation: Mapped[str] = mapped_column(Text, nullable=False, default="")
    harmonized_vector: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cpu_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    memory_mb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    thread_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    open_handles: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    loaded_modules: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
