from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

class TelemetryPayload(BaseModel):
    timestamp: Optional[str] = Field(default_factory=lambda: datetime.utcnow().isoformat())
    hostname: str = Field(..., example="DESKTOP-MSU-LAB01")
    snapshot_label: str = Field(..., example="SYSTEM_SNAPSHOT")
    accessible_processes: int = Field(..., example=120)
    pslist_nproc: int = Field(..., example=140)
    pslist_nppid: int = Field(..., example=48)
    pslist_avg_threads: float = Field(..., example=12.4)
    pslist_avg_handlers: float = Field(..., example=248.0)
    dlllist_ndlls: int = Field(..., example=2100)
    dlllist_avg_dlls_per_proc: float = Field(..., example=46.5)
    handles_nhandles: int = Field(..., example=12000)
    handles_avg_handles_per_proc: float = Field(..., example=260.0)
    pid: Optional[int] = Field(default=0, example=0)
    # Behavioural file-activity fields (optional; sent by the agent)
    behavioural_level: Optional[str] = Field(default="SAFE", example="CRITICAL")
    behavioural_score: Optional[int] = Field(default=0, example=95)
    behavioural_reasons: Optional[List[str]] = Field(default_factory=list)
    modify_rate: Optional[float] = Field(default=0.0, example=180.0)
    rename_rate: Optional[float] = Field(default=0.0, example=170.0)
    suspicious_renames: Optional[int] = Field(default=0, example=900)

class SHAPImpact(BaseModel):
    feature: str
    impact: float

class AssessmentResponse(BaseModel):
    telemetry_id: int
    snapshot_label: str
    pid: int
    prediction: str
    confidence: float
    risk_score: int
    severity: str
    top_shap_features: List[SHAPImpact]
    harmonized_vector: Dict[str, float]
    recommendation: str
    hostname: Optional[str] = None
    timestamp: Optional[str] = None
    # Detection breakdown
    model_severity: Optional[str] = None
    model_risk_score: Optional[int] = None
    behavioural_level: Optional[str] = None
    behavioural_score: Optional[int] = None
    behavioural_reasons: Optional[List[str]] = Field(default_factory=list)
    triggered_by: Optional[str] = None


class AssessmentRecordOut(BaseModel):
    id: int
    timestamp: str
    hostname: str
    snapshot_label: str
    pid: int
    prediction: str
    confidence: float
    risk_score: int
    severity: str
    top_shap_features: List[SHAPImpact]
    recommendation: str
    harmonized_vector: Optional[Dict[str, float]] = None
    behavioural_level: Optional[str] = None
    behavioural_score: Optional[int] = None
    behavioural_reasons: Optional[List[str]] = Field(default_factory=list)
    triggered_by: Optional[str] = None


class HistoryResponse(BaseModel):
    items: List[AssessmentRecordOut]
    total: int
    total_count: int
    page: int
    page_size: int


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    db_connected: bool
    service: str = "FastAPI AegisAI Engine"
    version: str = "1.0.0"


class MetricsResponse(BaseModel):
    total_scanned: int
    threats_detected: int
    safe_processes: int
    avg_risk_score: float
    latest_timestamp: Optional[str] = None
    severity_counts: Dict[str, int]