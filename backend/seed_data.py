"""
Seed Data Script
Populates the database with 14 days of synthetic check-in data
for development and demonstration purposes.

Run: python seed_data.py
"""
import sys, os, json, random
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine, ensure_schema
from models import Base, UserSession, DailyCheckin, EmotionalTrend
from services import nlp_service, cbt_service, trend_service

Base.metadata.create_all(bind=engine)
ensure_schema()

DEMO_SESSION = "demo-session-0000-0000-0000-000000000001"

SAMPLE_TEXTS = [
    "I feel really overwhelmed today. There's too much on my plate and I can't focus.",
    "Had a good morning but the afternoon was exhausting. I tried to stay positive.",
    "Feeling a bit anxious about upcoming deadlines. Hard to concentrate.",
    "Today was surprisingly okay. Connected with a friend and felt better.",
    "I am really tired. Everything feels heavy and I don't know why.",
    "Slept well last night. Feeling more energetic than usual today.",
    "Work was stressful but I managed to complete the important tasks.",
    "Feeling hopeful about the week ahead. Took a walk and it helped.",
    "Very low energy. Struggling to find motivation for anything.",
    "Had a panic moment in the morning but calmed down after breathing exercises.",
    "Things are okay. Not great, not terrible. Just moving through the day.",
    "Feeling grateful today. Noticed some small beautiful things around me.",
    "Irritable and frustrated. Small things are bothering me more than usual.",
    "Good day overall. Exercised and felt a sense of accomplishment.",
]

def seed():
    db = SessionLocal()
    try:
        # Clean up any existing demo data
        db.query(DailyCheckin).filter(DailyCheckin.session_id == DEMO_SESSION).delete()
        db.query(EmotionalTrend).filter(EmotionalTrend.session_id == DEMO_SESSION).delete()
        db.query(UserSession).filter(UserSession.session_id == DEMO_SESSION).delete()
        db.commit()

        # Create session
        sess = UserSession(
            session_id=DEMO_SESSION,
            streak_days=14,
            last_checkin_date=date.today().isoformat(),
        )
        db.add(sess)
        db.commit()

        today = date.today()
        checkin_rows = []

        for i in range(14):
            day = today - timedelta(days=13 - i)
            day_str = day.isoformat()

            # Simulate a mild dip in the middle, improving by end
            if i < 4:
                e_state = random.randint(3, 4)
                stress  = random.randint(2, 3)
                cog     = random.randint(2, 3)
                motiv   = random.randint(3, 5)
            elif i < 8:
                e_state = random.randint(1, 3)
                stress  = random.randint(3, 5)
                cog     = random.randint(3, 5)
                motiv   = random.randint(1, 3)
            else:
                e_state = random.randint(3, 5)
                stress  = random.randint(1, 3)
                cog     = random.randint(2, 3)
                motiv   = random.randint(3, 5)

            text = random.choice(SAMPLE_TEXTS)

            nlp = nlp_service.analyze(text, e_state, stress, cog, motiv)
            cbt = cbt_service.generate(
                stress_level=stress,
                emotional_state=e_state,
                motivation_level=motiv,
                cognitive_load=cog,
                vader_compound=nlp["vader_compound"],
                dominant_emotion=nlp["dominant_emotion"],
            )

            c = DailyCheckin(
                session_id=DEMO_SESSION,
                checkin_date=day_str,
                emotional_state=e_state,
                stress_level=stress,
                cognitive_load=cog,
                motivation_level=motiv,
                text_response=text,
                sentiment_polarity=nlp["sentiment_polarity"],
                sentiment_subjectivity=nlp["sentiment_subjectivity"],
                vader_compound=nlp["vader_compound"],
                emotional_intensity=nlp["emotional_intensity"],
                dominant_emotion=nlp["dominant_emotion"],
                keywords=json.dumps(nlp["keywords"]),
                composite_score=nlp["composite_score"],
                cbt_response=cbt["message"],
                cbt_category=cbt["category"],
            )
            db.add(c)
            checkin_rows.append({
                "emotional_state": e_state,
                "stress_level": stress,
                "cognitive_load": cog,
                "motivation_level": motiv,
                "vader_compound": nlp["vader_compound"],
                "composite_score": nlp["composite_score"],
            })

        db.commit()

        # Compute and save trends
        trend_data = trend_service.compute(checkin_rows)
        trend = EmotionalTrend(session_id=DEMO_SESSION, **trend_data)
        db.add(trend)
        db.commit()

        print(f"Success! Seeded 14 days of data for demo session: {DEMO_SESSION}")
        print(f"   Trend: {trend_data['trend_direction']} | Insight: {trend_data['insight_message'][:80]}...")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
