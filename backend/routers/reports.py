"""
Reports Router
GET /api/report/pdf — Download a PDF emotional wellness report
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from database import get_db
from models import DailyCheckin, EmotionalTrend
from services import report_service

router = APIRouter(prefix="/api/report", tags=["Reports"])


@router.get("/pdf")
def download_pdf(session_id: str, db: Session = Depends(get_db)):
    checkins = (
        db.query(DailyCheckin)
        .filter(DailyCheckin.session_id == session_id)
        .order_by(DailyCheckin.checkin_date.asc())
        .all()
    )
    if not checkins:
        raise HTTPException(status_code=404, detail="No check-ins found for this session.")

    trend = (
        db.query(EmotionalTrend)
        .filter(EmotionalTrend.session_id == session_id)
        .first()
    )

    # Serialise ORM objects into plain dicts
    checkin_dicts = [
        {col.name: getattr(c, col.name) for col in c.__table__.columns}
        for c in checkins
    ]
    trend_dict = (
        {col.name: getattr(trend, col.name) for col in trend.__table__.columns}
        if trend else None
    )

    pdf_bytes = report_service.generate_pdf(session_id, checkin_dicts, trend_dict)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="mindtrack_report_{session_id[:8]}.pdf"'},
    )


@router.get("/csv")
def download_csv(session_id: str, db: Session = Depends(get_db)):
    """Export all checkins for a session as CSV."""
    import csv
    from io import StringIO

    checkins = (
        db.query(DailyCheckin)
        .filter(DailyCheckin.session_id == session_id)
        .order_by(DailyCheckin.checkin_date.asc())
        .all()
    )
    if not checkins:
        raise HTTPException(status_code=404, detail="No check-ins found for this session.")

    si = StringIO()
    cw = csv.writer(si)
    
    # Write headers
    headers = [
        col.name for col in DailyCheckin.__table__.columns
        if col.name not in ["id", "session_id"]
    ]
    cw.writerow(headers)

    # Write data
    for c in checkins:
        row = [getattr(c, h) for h in headers]
        cw.writerow(row)

    output = si.getvalue()
    si.close()

    return Response(
        content=output,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="mindtrack_data_{session_id[:8]}.csv"'},
    )

@router.get("/session")
def get_session_info(session_id: str, db: Session = Depends(get_db)):
    """Quick endpoint to retrieve session streak info."""
    from models import UserSession
    sess = db.query(UserSession).filter(UserSession.session_id == session_id).first()
    if not sess:
        return {"session_id": session_id, "streak_days": 0, "exists": False}
    return {
        "session_id": sess.session_id,
        "streak_days": sess.streak_days,
        "last_checkin_date": sess.last_checkin_date,
        "exists": True,
    }
