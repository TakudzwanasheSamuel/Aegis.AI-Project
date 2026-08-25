from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

class TelemetryPayload(BaseModel):
    timestamp: Optional[str] = Field(default_factory=lambda: datetime.utcnow().isoformat())
    hostname: str = Field(..., example="DESKTOP-MSU-LAB01")
    process_name: str = Field(..., example="encryptor_sim.exe")
    pid: int = Field(..., example=4032)
    cpu_percent: float = Field(..., example=84.5)
    memory_mb: float = Field(..., example=512.0)
    thread_count: int = Field(..., example=128)
    open_handles: int = Field(..., example=850)
    loaded_modules: int = Field(..., example=45)

class SHAPImpact(BaseModel):
    feature: str
    impact: float

class AssessmentResponse(BaseModel):
    telemetry_id: int
    process_name: str
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


class AssessmentRecordOut(BaseModel):
    id: int
    timestamp: str
    hostname: str
    process_name: str
    pid: int
    prediction: str
    confidence: float
    risk_score: int
    severity: str
    top_shap_features: List[SHAPImpact]
    recommendation: str
    harmonized_vector: Optional[Dict[str, float]] = None
    cpu_percent: Optional[float] = None
    memory_mb: Optional[float] = None
    thread_count: Optional[int] = None
    open_handles: Optional[int] = None
    loaded_modules: Optional[int] = None


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
