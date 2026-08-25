from datetime import datetime, timezone

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api import analytics, telemetry
from app.database.session import get_db, init_db
from app.schemas.telemetry import HealthResponse

app = FastAPI(
    title="AegisAI Cybersecurity Threat Engine",
    description="Explainable Hybrid Behavioral Ransomware Detection Microservice",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(telemetry.router)
app.include_router(analytics.router)


@app.on_event("startup")
def on_startup():
    init_db()


def _health_payload(db: Session) -> HealthResponse:
    db_connected = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_connected = False
    return HealthResponse(
        status="online" if db_connected else "degraded",
        timestamp=datetime.now(timezone.utc).isoformat(),
        db_connected=db_connected,
    )


@app.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    return _health_payload(db)


@app.get("/api/v1/health", response_model=HealthResponse)
def health_check_v1(db: Session = Depends(get_db)):
    return _health_payload(db)
