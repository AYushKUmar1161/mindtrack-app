"""
Wellness score and weekly insight calculations.
"""
import statistics


def _as_dict(checkin) -> dict:
    if isinstance(checkin, dict):
        return checkin
    return {col.name: getattr(checkin, col.name) for col in checkin.__table__.columns}


def _avg(values: list[float]) -> float | None:
    return round(sum(values) / len(values), 3) if values else None


def _score_from_row(row: dict) -> float:
    mood = float(row.get("emotional_state") or 3)
    stress = 6 - float(row.get("stress_level") or 3)
    cognitive = 6 - float(row.get("cognitive_load") or 3)
    motivation = float(row.get("motivation_level") or 3)
    sentiment = ((float(row.get("vader_compound") or 0) + 1) / 2) * 5
    raw = (mood * 0.32) + (stress * 0.24) + (motivation * 0.22) + (cognitive * 0.14) + (sentiment * 0.08)
    return round((raw / 5) * 100, 1)


def compute(checkins: list, trend: dict | None = None) -> dict:
    rows = [_as_dict(c) for c in checkins]
    if not rows:
        return {
            "score": None,
            "label": "No data yet",
            "weekly_improvement_pct": None,
            "stability_index": None,
            "components": {},
            "summary": "Complete your first check-in to calculate a wellness score.",
        }

    scores = [_score_from_row(r) for r in rows]
    recent_scores = scores[-7:]
    previous_scores = scores[-14:-7]
    current = round(sum(recent_scores) / len(recent_scores), 1)

    if previous_scores:
        previous = sum(previous_scores) / len(previous_scores)
        weekly_improvement = round(((current - previous) / max(previous, 1)) * 100, 1)
    else:
        weekly_improvement = None

    mood_values = [float(r.get("emotional_state") or 3) for r in rows]
    if len(mood_values) > 1:
        variability = min(statistics.stdev(mood_values) / 2.0, 1.0)
        stability_index = round((1 - variability) * 100, 1)
    else:
        stability_index = 100.0

    if current >= 78:
        label = "Strong"
    elif current >= 62:
        label = "Steady"
    elif current >= 45:
        label = "Needs support"
    else:
        label = "High support needed"

    components = {
        "mood": round(((sum(mood_values) / len(mood_values)) / 5) * 100, 1),
        "stress_balance": round((((6 - _avg([float(r.get("stress_level") or 3) for r in rows])) / 5) * 100), 1),
        "motivation": round(((_avg([float(r.get("motivation_level") or 3) for r in rows])) / 5) * 100, 1),
        "focus": round((((6 - _avg([float(r.get("cognitive_load") or 3) for r in rows])) / 5) * 100), 1),
    }

    if weekly_improvement is not None and weekly_improvement > 5:
        summary = "Your weekly wellness score is improving. Keep repeating the conditions that helped."
    elif weekly_improvement is not None and weekly_improvement < -5:
        summary = "Your weekly wellness score has dipped. Consider adding a lighter schedule and more support."
    elif stability_index < 55:
        summary = "Your score is fairly variable. Consistent sleep, meals, and breaks may help stabilize it."
    else:
        summary = "Your score is stable enough to watch small changes without overreacting to one day."

    return {
        "score": current,
        "label": label,
        "weekly_improvement_pct": weekly_improvement,
        "stability_index": stability_index,
        "components": components,
        "summary": summary,
    }
