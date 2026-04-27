"""
Check-in Router
POST /api/checkin        — Submit daily 5-question check-in
GET  /api/checkin/today  — Whether user has checked in today
GET  /api/checkin/all    — Paginated list of all check-ins
"""
import json
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import UserSession, DailyCheckin, EmotionalTrend
from schemas import CheckinCreate, CheckinResponse, ExplainabilityResponse, InterventionResponse
from services import (
    nlp_service,
    cbt_service,
    trend_service,
    personalization_service,
    prediction_service,
    intervention_service,
    explainability_service,
    llm_service,
)

router = APIRouter(prefix="/api/checkin", tags=["Check-in"])


def _get_or_create_session(session_id: str, db: Session) -> UserSession:
    sess = db.query(UserSession).filter(UserSession.session_id == session_id).first()
    if not sess:
        sess = UserSession(session_id=session_id)
        db.add(sess)
        db.commit()
        db.refresh(sess)
    return sess


def _update_streak(sess: UserSession, today_str: str, db: Session):
    """Increment streak if consecutive, reset if gap."""
    if sess.last_checkin_date is None:
        sess.streak_days = 1
    else:
        try:
            last = date.fromisoformat(sess.last_checkin_date)
            diff  = (date.fromisoformat(today_str) - last).days
            if diff == 1:
                sess.streak_days = (sess.streak_days or 0) + 1
            elif diff == 0:
                pass  # same day, no change
            else:
                sess.streak_days = 1  # streak broken
        except ValueError:
            sess.streak_days = 1
    sess.last_checkin_date = today_str
    db.commit()


def _rebuild_trend(session_id: str, db: Session):
    """Recompute and persist trend after a new check-in."""
    checkins = (
        db.query(DailyCheckin)
        .filter(DailyCheckin.session_id == session_id)
        .order_by(DailyCheckin.checkin_date)
        .all()
    )
    rows = [{
        "emotional_state":  c.emotional_state,
        "stress_level":     c.stress_level,
        "cognitive_load":   c.cognitive_load,
        "motivation_level": c.motivation_level,
        "vader_compound":   c.vader_compound or 0.0,
        "composite_score":  c.composite_score or float(c.emotional_state),
    } for c in checkins]

    trend_data = trend_service.compute(rows)
    trend = db.query(EmotionalTrend).filter(EmotionalTrend.session_id == session_id).first()
    if not trend:
        trend = EmotionalTrend(session_id=session_id)
        db.add(trend)

    for key, val in trend_data.items():
        setattr(trend, key, val)
    db.commit()
    return trend


def _compose_cbt_text(cbt: dict, personalization_note: str | None = None) -> str:
    parts = [cbt["message"]]
    if cbt.get("exercise"):
        parts.append(f"Exercise: {cbt['exercise']}")
    if cbt.get("affirmation"):
        parts.append(f"Affirmation: {cbt['affirmation']}")
    if personalization_note:
        parts.append(f"Personalized note: {personalization_note}")
    return "\n\n".join(parts)


def _augment_checkin_response(checkin: DailyCheckin, checkins: list[DailyCheckin]) -> CheckinResponse:
    profile = personalization_service.build_profile(checkins)
    forecast = prediction_service.forecast(checkins)
    interventions = intervention_service.build_interventions(
        emotional_state=checkin.emotional_state,
        stress_level=checkin.stress_level,
        cognitive_load=checkin.cognitive_load,
        motivation_level=checkin.motivation_level,
        forecast=forecast,
        profile=profile,
    )
    explanation = explainability_service.build_explanation(
        emotional_state=checkin.emotional_state,
        stress_level=checkin.stress_level,
        cognitive_load=checkin.cognitive_load,
        motivation_level=checkin.motivation_level,
        sentiment_polarity=checkin.sentiment_polarity,
        vader_compound=checkin.vader_compound,
        dominant_emotion=checkin.dominant_emotion,
        keywords=checkin.keywords,
        cbt_category=checkin.cbt_category,
    )
    response = CheckinResponse.model_validate(checkin)
    return response.model_copy(update={
        "explainability": ExplainabilityResponse(**explanation),
        "interventions": [InterventionResponse(**item) for item in interventions],
    })


@router.post("", response_model=CheckinResponse)
def submit_checkin(payload: CheckinCreate, db: Session = Depends(get_db)):
    today_str = date.today().isoformat()

    # Check for duplicate today
    existing = (
        db.query(DailyCheckin)
        .filter(
            DailyCheckin.session_id == payload.session_id,
            DailyCheckin.checkin_date == today_str,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail="You've already checked in today. Come back tomorrow!"
        )

    # Session management
    sess = _get_or_create_session(payload.session_id, db)
    historical_checkins = (
        db.query(DailyCheckin)
        .filter(DailyCheckin.session_id == payload.session_id)
        .order_by(DailyCheckin.checkin_date.asc())
        .all()
    )
    profile = personalization_service.build_profile(historical_checkins)

    # NLP analysis
    nlp = nlp_service.analyze(
        text=payload.text_response,
        emotional_state=payload.emotional_state,
        stress_level=payload.stress_level,
        cognitive_load=payload.cognitive_load,
        motivation_level=payload.motivation_level,
    )

    # Get trend direction for better CBT selection
    existing_trend = db.query(EmotionalTrend).filter(EmotionalTrend.session_id == payload.session_id).first()
    trend_dir = existing_trend.trend_direction if existing_trend else None

    # CBT response
    cbt = cbt_service.generate(
        stress_level=payload.stress_level,
        emotional_state=payload.emotional_state,
        motivation_level=payload.motivation_level,
        cognitive_load=payload.cognitive_load,
        vader_compound=nlp["vader_compound"],
        dominant_emotion=nlp["dominant_emotion"],
        trend_direction=trend_dir,
    )
    personalization_note = (
        profile["adaptation_note"]
        if profile.get("history_size", 0) >= 3
        else None
    )
    cbt_text = _compose_cbt_text(cbt, personalization_note)

    ai_reflection = llm_service.generate_reflection(
        text_response=payload.text_response,
        nlp=nlp,
        cbt=cbt,
        profile_context=personalization_service.compact_context(profile),
    )

    # Persist check-in
    checkin = DailyCheckin(
        session_id=payload.session_id,
        checkin_date=today_str,
        emotional_state=payload.emotional_state,
        stress_level=payload.stress_level,
        cognitive_load=payload.cognitive_load,
        motivation_level=payload.motivation_level,
        text_response=payload.text_response,
        sentiment_polarity=nlp["sentiment_polarity"],
        sentiment_subjectivity=nlp["sentiment_subjectivity"],
        vader_compound=nlp["vader_compound"],
        emotional_intensity=nlp["emotional_intensity"],
        dominant_emotion=nlp["dominant_emotion"],
        keywords=json.dumps(nlp["keywords"]),
        composite_score=nlp["composite_score"],
        cbt_response=cbt_text,
        cbt_category=cbt["category"],
        ai_reflection=ai_reflection,
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)

    _update_streak(sess, today_str, db)
    _rebuild_trend(payload.session_id, db)

    all_checkins = historical_checkins + [checkin]
    return _augment_checkin_response(checkin, all_checkins)


@router.get("/today")
def has_checked_in_today(session_id: str, db: Session = Depends(get_db)):
    today_str = date.today().isoformat()
    existing = (
        db.query(DailyCheckin)
        .filter(
            DailyCheckin.session_id == session_id,
            DailyCheckin.checkin_date == today_str,
        )
        .first()
    )
    augmented = None
    if existing:
        checkins = (
            db.query(DailyCheckin)
            .filter(DailyCheckin.session_id == session_id)
            .order_by(DailyCheckin.checkin_date.asc())
            .all()
        )
        augmented = _augment_checkin_response(existing, checkins)

    return {
        "checked_in": existing is not None,
        "date": today_str,
        "checkin": augmented,
    }


@router.get("/all", response_model=list[CheckinResponse])
def list_checkins(
    session_id: str,
    limit: int = 30,
    db: Session = Depends(get_db),
):
    return (
        db.query(DailyCheckin)
        .filter(DailyCheckin.session_id == session_id)
        .order_by(DailyCheckin.checkin_date.desc())
        .limit(limit)
        .all()
    )
