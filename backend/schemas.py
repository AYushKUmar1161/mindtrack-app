from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime


# ── Session ──────────────────────────────────────────────────────────────────
class SessionCreate(BaseModel):
    session_id: str

class SessionResponse(BaseModel):
    session_id: str
    streak_days: int
    last_checkin_date: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Check-in ─────────────────────────────────────────────────────────────────
class CheckinCreate(BaseModel):
    session_id: str
    emotional_state: int = Field(..., ge=1, le=5, description="Q1: How do you feel? (1-5)")
    stress_level: int    = Field(..., ge=1, le=5, description="Q2: Stress level (1-5)")
    cognitive_load: int  = Field(..., ge=1, le=5, description="Q3: Mental load (1-5)")
    motivation_level: int = Field(..., ge=1, le=5, description="Q4: Motivation (1-5)")
    text_response: Optional[str] = Field(None, max_length=2000, description="Q5: Open-ended")

    @field_validator("text_response")
    @classmethod
    def sanitize_text(cls, v):
        if v:
            return v.strip()[:2000]
        return v


class CheckinResponse(BaseModel):
    id: int
    session_id: str
    checkin_date: str
    timestamp: datetime
    emotional_state: int
    stress_level: int
    cognitive_load: int
    motivation_level: int
    text_response: Optional[str]
    sentiment_polarity: Optional[float]
    sentiment_subjectivity: Optional[float]
    vader_compound: Optional[float]
    emotional_intensity: Optional[float]
    dominant_emotion: Optional[str]
    keywords: Optional[str]
    composite_score: Optional[float]
    cbt_response: Optional[str]
    cbt_category: Optional[str]
    ai_reflection: Optional[str] = None
    explainability: Optional["ExplainabilityResponse"] = None
    interventions: List["InterventionResponse"] = Field(default_factory=list)

    class Config:
        from_attributes = True


# ── NLP Analysis ──────────────────────────────────────────────────────────────
class NLPResult(BaseModel):
    sentiment_polarity: float
    sentiment_subjectivity: float
    vader_compound: float
    emotional_intensity: float
    dominant_emotion: str
    keywords: List[str]
    composite_score: float


# ── Trend ─────────────────────────────────────────────────────────────────────
class TrendResponse(BaseModel):
    session_id: str
    days_tracked: int
    avg_emotional_state: Optional[float]
    avg_stress: Optional[float]
    avg_cognitive_load: Optional[float]
    avg_motivation: Optional[float]
    avg_sentiment: Optional[float]
    variability_score: Optional[float]
    mood_swing_detected: bool
    stress_spike_detected: bool
    trend_direction: Optional[str]
    insight_message: Optional[str]
    computed_at: datetime

    class Config:
        from_attributes = True


# ---- Intelligence layer ----------------------------------------------------
class EmotionFrequency(BaseModel):
    emotion: str
    count: int


class StressPattern(BaseModel):
    average: Optional[float]
    recent_average: Optional[float]
    direction: str
    high_stress_days: int


class TimeOfDayMood(BaseModel):
    period: str
    average_score: float
    checkins: int


class PersonalizationResponse(BaseModel):
    frequent_emotions: List[EmotionFrequency]
    stress_pattern: StressPattern
    time_of_day_mood: List[TimeOfDayMood]
    preferred_response_category: Optional[str]
    adaptation_note: str
    history_size: int


class ForecastResponse(BaseModel):
    available: bool
    next_mood_score: Optional[float]
    next_stress_level: Optional[float]
    risk_level: str
    message: str
    basis: str


class WellnessResponse(BaseModel):
    score: Optional[float]
    label: str
    weekly_improvement_pct: Optional[float]
    stability_index: Optional[float]
    components: dict[str, Any]
    summary: str


class InterventionResponse(BaseModel):
    type: str
    title: str
    message: str
    action: str
    priority: str


class ExplainabilityResponse(BaseModel):
    emotion: str
    sentiment: Optional[float]
    polarity: Optional[float]
    keywords: List[str]
    response_category: Optional[str]
    triggers: List[str]
    decision_path: List[str]
    reason: str


CheckinResponse.model_rebuild()


# ── Dashboard ─────────────────────────────────────────────────────────────────
class DashboardPoint(BaseModel):
    date: str
    emotional_state: int
    stress_level: int
    cognitive_load: int
    motivation_level: int
    sentiment_polarity: Optional[float]
    vader_compound: Optional[float]
    composite_score: Optional[float]
    dominant_emotion: Optional[str]
    cbt_category: Optional[str]


class DashboardResponse(BaseModel):
    session_id: str
    streak_days: int
    checkins: List[DashboardPoint]
    trend: Optional[TrendResponse]
    total_checkins: int
    personalization: Optional[PersonalizationResponse] = None
    forecast: Optional[ForecastResponse] = None
    wellness: Optional[WellnessResponse] = None
    explainability: Optional[ExplainabilityResponse] = None
    interventions: List[InterventionResponse] = Field(default_factory=list)


class MemorySearchResponse(BaseModel):
    session_id: str
    query: str
    total_matches: int
    results: List[CheckinResponse]


# ── CBT Response ──────────────────────────────────────────────────────────────
class CBTResponseOut(BaseModel):
    category: str
    message: str
    exercise: Optional[str]
    affirmation: str


# ── Report ────────────────────────────────────────────────────────────────────
class ReportRequest(BaseModel):
    session_id: str
