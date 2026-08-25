from pathlib import Path

from sqlalchemy import inspect, text
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

DB_DIR = Path(__file__).resolve().parents[1] / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "aegisai.db"
DATABASE_URL = f"sqlite:///{DB_PATH.as_posix()}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    future=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def init_db() -> None:
    from app.database.models import Base

    Base.metadata.create_all(bind=engine)
    _ensure_sqlite_columns()


def _ensure_sqlite_columns() -> None:
    """Add columns introduced after the first SQLite create_all()."""
    inspector = inspect(engine)
    if "assessment_records" not in inspector.get_table_names():
        return
    existing = {column["name"] for column in inspector.get_columns("assessment_records")}
    statements: list[str] = []
    if "harmonized_vector" not in existing:
        statements.append("ALTER TABLE assessment_records ADD COLUMN harmonized_vector TEXT")
    if not statements:
        return
    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
