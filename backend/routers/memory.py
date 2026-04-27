"""
Second-brain search router.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import DailyCheckin
from schemas import MemorySearchResponse
from services import search_service

router = APIRouter(prefix="/api/memory", tags=["Memory Search"])


@router.get("/search", response_model=MemorySearchResponse)
def search_memory(
    session_id: str,
    q: str = "",
    emotion: str | None = None,
    category: str | None = None,
    min_stress: int | None = None,
    min_motivation: int | None = None,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    checkins = (
        db.query(DailyCheckin)
        .filter(DailyCheckin.session_id == session_id)
        .order_by(DailyCheckin.checkin_date.asc())
        .all()
    )
    results = search_service.search(
        checkins,
        query=q,
        emotion=emotion,
        category=category,
        min_stress=min_stress,
        min_motivation=min_motivation,
        limit=limit,
    )
    return MemorySearchResponse(
        session_id=session_id,
        query=q,
        total_matches=len(results),
        results=results,
    )
