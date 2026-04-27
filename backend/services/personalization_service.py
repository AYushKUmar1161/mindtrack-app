"""
Personalization engine.

Builds a lightweight user profile from historical check-ins so the app can
adapt responses without storing private identity data.
"""
from collections import Counter, defaultdict
from datetime import datetime


def _as_dict(checkin) -> dict:
    if isinstance(checkin, dict):
        return checkin
    return {col.name: getattr(checkin, col.name) for col in checkin.__table__.columns}


def _bucket_hour(dt: datetime | None) -> str:
    if not dt:
        return "unknown"
    hour = dt.hour
    if 5 <= hour < 12:
        return "morning"
    if 12 <= hour < 17:
        return "afternoon"
    if 17 <= hour < 21:
        return "evening"
    return "night"


def build_profile(checkins: list) -> dict:
    rows = [_as_dict(c) for c in checkins]
    if not rows:
        return {
            "frequent_emotions": [],
            "stress_pattern": {
                "average": None,
                "recent_average": None,
                "direction": "unknown",
                "high_stress_days": 0,
            },
            "time_of_day_mood": [],
            "preferred_response_category": None,
            "adaptation_note": "Complete a few check-ins so MindTrack can personalize responses.",
            "history_size": 0,
        }

    emotions = Counter(
        r.get("dominant_emotion") or "neutral"
        for r in rows
        if r.get("dominant_emotion")
    )
    categories = Counter(
        r.get("cbt_category")
        for r in rows
        if r.get("cbt_category")
    )

    stresses = [float(r.get("stress_level") or 0) for r in rows]
    avg_stress = round(sum(stresses) / len(stresses), 2)
    recent = stresses[-5:] if len(stresses) >= 5 else stresses
    recent_avg = round(sum(recent) / len(recent), 2)
    first_half = stresses[: max(1, len(stresses) // 2)]
    second_half = stresses[max(1, len(stresses) // 2):] or first_half
    delta = (sum(second_half) / len(second_half)) - (sum(first_half) / len(first_half))
    direction = "rising" if delta > 0.35 else "falling" if delta < -0.35 else "stable"

    mood_buckets: dict[str, list[float]] = defaultdict(list)
    for row in rows:
        bucket = _bucket_hour(row.get("timestamp"))
        value = row.get("composite_score") or row.get("emotional_state")
        if value is not None:
            mood_buckets[bucket].append(float(value))

    time_of_day = [
        {
            "period": period,
            "average_score": round(sum(values) / len(values), 2),
            "checkins": len(values),
        }
        for period, values in mood_buckets.items()
    ]
    time_of_day.sort(key=lambda item: ["morning", "afternoon", "evening", "night", "unknown"].index(item["period"]))

    frequent_emotions = [
        {"emotion": emotion, "count": count}
        for emotion, count in emotions.most_common(3)
    ]
    preferred_category = categories.most_common(1)[0][0] if categories else None
    top_emotion = frequent_emotions[0]["emotion"] if frequent_emotions else "neutral"

    if direction == "rising":
        note = f"Stress has been rising recently, so responses should emphasize regulation and planning."
    elif top_emotion in {"fear", "sadness", "exhaustion"}:
        note = f"{top_emotion.title()} appears often, so responses should be extra validating and concrete."
    else:
        note = "Recent patterns look steady, so responses can focus on sustaining helpful habits."

    return {
        "frequent_emotions": frequent_emotions,
        "stress_pattern": {
            "average": avg_stress,
            "recent_average": recent_avg,
            "direction": direction,
            "high_stress_days": sum(1 for s in stresses if s >= 4),
        },
        "time_of_day_mood": time_of_day,
        "preferred_response_category": preferred_category,
        "adaptation_note": note,
        "history_size": len(rows),
    }


def compact_context(profile: dict) -> str:
    emotions = ", ".join(
        f"{item['emotion']}({item['count']})"
        for item in profile.get("frequent_emotions", [])
    ) or "not enough history"
    stress = profile.get("stress_pattern", {})
    return (
        f"Frequent emotions: {emotions}. "
        f"Stress direction: {stress.get('direction', 'unknown')}; "
        f"recent stress average: {stress.get('recent_average')}. "
        f"Adaptation: {profile.get('adaptation_note')}"
    )
