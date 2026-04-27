"""
Second-brain search over past reflections.
"""


EMOTION_ALIASES = {
    "anxious": "fear",
    "anxiety": "fear",
    "worried": "fear",
    "panic": "fear",
    "sad": "sadness",
    "low": "sadness",
    "angry": "anger",
    "frustrated": "anger",
    "happy": "joy",
    "good": "joy",
    "tired": "exhaustion",
    "exhausted": "exhaustion",
}


def _as_dict(checkin) -> dict:
    if isinstance(checkin, dict):
        return checkin
    return {col.name: getattr(checkin, col.name) for col in checkin.__table__.columns}


def _matches_query(row: dict, query: str) -> bool:
    if not query:
        return True
    q = query.lower().strip()
    text = (row.get("text_response") or "").lower()
    emotion = (row.get("dominant_emotion") or "").lower()
    category = (row.get("cbt_category") or "").lower()

    for word, mapped_emotion in EMOTION_ALIASES.items():
        if word in q and emotion == mapped_emotion:
            return True

    if "productive" in q or "motivated" in q:
        return float(row.get("motivation_level") or 0) >= 4
    if "stress" in q or "stressed" in q:
        return float(row.get("stress_level") or 0) >= 4
    if "best" in q or "highest" in q:
        return float(row.get("composite_score") or 0) >= 4
    if "worst" in q or "lowest" in q:
        return float(row.get("composite_score") or 5) <= 2.5

    terms = [term for term in q.replace("?", " ").split() if len(term) > 2]
    return any(term in text or term in emotion or term in category for term in terms)


def search(
    checkins: list,
    *,
    query: str = "",
    emotion: str | None = None,
    category: str | None = None,
    min_stress: int | None = None,
    min_motivation: int | None = None,
    limit: int = 20,
) -> list[dict]:
    rows = [_as_dict(c) for c in checkins]
    matches = []
    for row in rows:
        if emotion and (row.get("dominant_emotion") or "").lower() != emotion.lower():
            continue
        if category and (row.get("cbt_category") or "").lower() != category.lower():
            continue
        if min_stress is not None and int(row.get("stress_level") or 0) < min_stress:
            continue
        if min_motivation is not None and int(row.get("motivation_level") or 0) < min_motivation:
            continue
        if not _matches_query(row, query):
            continue
        matches.append(row)

    if query and ("most productive" in query.lower() or "best" in query.lower()):
        matches.sort(key=lambda r: (r.get("motivation_level") or 0, r.get("composite_score") or 0), reverse=True)
    elif query and ("most stressed" in query.lower() or "stress" in query.lower()):
        matches.sort(key=lambda r: (r.get("stress_level") or 0, r.get("checkin_date") or ""), reverse=True)
    else:
        matches.sort(key=lambda r: r.get("checkin_date") or "", reverse=True)

    return matches[: max(1, min(limit, 100))]
