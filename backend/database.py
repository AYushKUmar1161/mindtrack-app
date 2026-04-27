from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'mindtrack.db')}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_schema():
    """Apply tiny SQLite-compatible schema additions for local development."""
    with engine.begin() as conn:
        if engine.dialect.name != "sqlite":
            return
        columns = {
            row[1]
            for row in conn.execute(text("PRAGMA table_info(daily_checkins)")).fetchall()
        }
        if "ai_reflection" not in columns:
            conn.execute(text("ALTER TABLE daily_checkins ADD COLUMN ai_reflection TEXT"))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
