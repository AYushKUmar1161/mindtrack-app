"""
Dashboard Router
GET /api/dashboard — Full dashboard payload for the frontend
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from database import get_db
from models import UserSession, DailyCheckin, EmotionalTrend
from schemas import DashboardResponse, DashboardPoint, TrendResponse
from services import (
    personalization_service,
    prediction_service,
    wellness_service,
    explainability_service,
    intervention_service,
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(session_id: str, db: Session = Depends(get_db)):
    sess = db.query(UserSession).filter(UserSession.session_id == session_id).first()
    if not sess:
        # Return empty dashboard for new session
        return DashboardResponse(
            session_id=session_id,
            streak_days=0,
            checkins=[],
            trend=None,
            total_checkins=0,
        )

    total_checkins = (
        db.query(DailyCheckin)
        .filter(DailyCheckin.session_id == session_id)
        .count()
    )

    checkins_raw = (
        db.query(DailyCheckin)
        .filter(DailyCheckin.session_id == session_id)
        .order_by(DailyCheckin.checkin_date.desc())
        .limit(15)   # Last 15 days per research spec
        .all()
    )
    checkins_raw.reverse()

    all_checkins = (
        db.query(DailyCheckin)
        .filter(DailyCheckin.session_id == session_id)
        .order_by(DailyCheckin.checkin_date.asc())
        .all()
    )

    trend_raw = (
        db.query(EmotionalTrend)
        .filter(EmotionalTrend.session_id == session_id)
        .first()
    )

    points = [
        DashboardPoint(
            date=c.checkin_date,
            emotional_state=c.emotional_state,
            stress_level=c.stress_level,
            cognitive_load=c.cognitive_load,
            motivation_level=c.motivation_level,
            sentiment_polarity=c.sentiment_polarity,
            vader_compound=c.vader_compound,
            composite_score=c.composite_score,
            dominant_emotion=c.dominant_emotion,
            cbt_category=c.cbt_category,
        )
        for c in checkins_raw
    ]

    trend_out = TrendResponse.model_validate(trend_raw) if trend_raw else None
    personalization = personalization_service.build_profile(all_checkins)
    forecast = prediction_service.forecast(all_checkins)
    wellness = wellness_service.compute(all_checkins)

    latest = all_checkins[-1] if all_checkins else None
    explainability = None
    interventions = []
    if latest:
        explainability = explainability_service.build_explanation(
            emotional_state=latest.emotional_state,
            stress_level=latest.stress_level,
            cognitive_load=latest.cognitive_load,
            motivation_level=latest.motivation_level,
            sentiment_polarity=latest.sentiment_polarity,
            vader_compound=latest.vader_compound,
            dominant_emotion=latest.dominant_emotion,
            keywords=latest.keywords,
            cbt_category=latest.cbt_category,
        )
        interventions = intervention_service.build_interventions(
            emotional_state=latest.emotional_state,
            stress_level=latest.stress_level,
            cognitive_load=latest.cognitive_load,
            motivation_level=latest.motivation_level,
            forecast=forecast,
            profile=personalization,
        )

    return DashboardResponse(
        session_id=session_id,
        streak_days=sess.streak_days or 0,
        checkins=points,
        trend=trend_out,
        total_checkins=total_checkins,
        personalization=personalization,
        forecast=forecast,
        wellness=wellness,
        explainability=explainability,
        interventions=interventions,
    )
