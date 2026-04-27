from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    """Registered users for cross-device sync."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(128), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("UserSession", back_populates="user")


class PushSubscription(Base):
    """Web Push API subscriptions for daily reminders."""
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("user_sessions.session_id", ondelete="CASCADE"), nullable=False)
    endpoint = Column(String(512), nullable=False, unique=True)
    p256dh = Column(String(256), nullable=False)
    auth = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserSession(Base):
    """Stores user sessions - anonymous or authenticated."""
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    streak_days = Column(Integer, default=0)
    last_checkin_date = Column(String(10), nullable=True)  # YYYY-MM-DD

    user = relationship("User", back_populates="sessions")
    checkins = relationship("DailyCheckin", back_populates="session", cascade="all, delete")


class DailyCheckin(Base):
    """5-question daily micro-interaction record."""
    __tablename__ = "daily_checkins"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("user_sessions.session_id"), index=True)
    checkin_date = Column(String(10), nullable=False)   # YYYY-MM-DD
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Q1-Q4: Likert scale 1-5
    emotional_state = Column(Integer, nullable=False)   # Q1
    stress_level = Column(Integer, nullable=False)       # Q2
    cognitive_load = Column(Integer, nullable=False)     # Q3
    motivation_level = Column(Integer, nullable=False)   # Q4

    # Q5: Open-ended text
    text_response = Column(Text, nullable=True)

    # NLP analysis results (populated after processing)
    sentiment_polarity = Column(Float, nullable=True)    # -1.0 to 1.0
    sentiment_subjectivity = Column(Float, nullable=True)
    vader_compound = Column(Float, nullable=True)        # -1.0 to 1.0
    emotional_intensity = Column(Float, nullable=True)   # 0.0 to 1.0
    dominant_emotion = Column(String(32), nullable=True)
    keywords = Column(Text, nullable=True)               # JSON list of keywords
    composite_score = Column(Float, nullable=True)       # Weighted composite 1-5

    # CBT response stored with the record
    cbt_response = Column(Text, nullable=True)
    cbt_category = Column(String(32), nullable=True)     # e.g. "grounding", "activation"
    ai_reflection = Column(Text, nullable=True)          # Optional OpenAI-generated reflection

    session = relationship("UserSession", back_populates="checkins")


class EmotionalTrend(Base):
    """Pre-computed trend summaries (updated after each check-in)."""
    __tablename__ = "emotional_trends"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), ForeignKey("user_sessions.session_id"), index=True)
    computed_at = Column(DateTime, default=datetime.utcnow)

    avg_emotional_state = Column(Float, nullable=True)
    avg_stress = Column(Float, nullable=True)
    avg_cognitive_load = Column(Float, nullable=True)
    avg_motivation = Column(Float, nullable=True)
    avg_sentiment = Column(Float, nullable=True)

    variability_score = Column(Float, nullable=True)     # Emotional variability 0-1
    mood_swing_detected = Column(Boolean, default=False)
    stress_spike_detected = Column(Boolean, default=False)
    trend_direction = Column(String(16), nullable=True)  # "improving","declining","stable"
    insight_message = Column(Text, nullable=True)
    days_tracked = Column(Integer, default=0)
