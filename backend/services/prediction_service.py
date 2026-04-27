"""
Predictive mood forecasting.

Uses a conservative blend of weighted moving average and linear trend. This is
not clinical prediction; it is an explainable short-term wellness signal.
"""


def _as_dict(checkin) -> dict:
    if isinstance(checkin, dict):
        return checkin
    return {col.name: getattr(checkin, col.name) for col in checkin.__table__.columns}


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _weighted_average(values: list[float], decay: float = 0.75) -> float:
    if not values:
        return 0.0
    weights = [decay ** (len(values) - 1 - i) for i in range(len(values))]
    total = sum(weights)
    return sum(v * w for v, w in zip(values, weights)) / total


def _slope(values: list[float]) -> float:
    n = len(values)
    if n < 2:
        return 0.0
    xs = list(range(n))
    x_mean = sum(xs) / n
    y_mean = sum(values) / n
    denom = sum((x - x_mean) ** 2 for x in xs)
    if denom == 0:
        return 0.0
    return sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, values)) / denom


def forecast(checkins: list) -> dict:
    rows = [_as_dict(c) for c in checkins][-10:]
    if len(rows) < 3:
        return {
            "available": False,
            "next_mood_score": None,
            "next_stress_level": None,
            "risk_level": "unknown",
            "message": "Add at least 3 check-ins to unlock short-term mood forecasting.",
            "basis": "Need more data for a stable prediction.",
        }

    mood = [float(r.get("composite_score") or r.get("emotional_state") or 3) for r in rows]
    stress = [float(r.get("stress_level") or 3) for r in rows]

    mood_forecast = _clamp(_weighted_average(mood) + _slope(mood), 1.0, 5.0)
    stress_forecast = _clamp(_weighted_average(stress) + _slope(stress), 1.0, 5.0)

    if stress_forecast >= 4.0 or mood_forecast <= 2.2:
        risk = "high"
        message = "Stress may increase soon based on recent trends. Plan a recovery break and reduce avoidable load."
    elif stress_forecast >= 3.3 or mood_forecast <= 3.0:
        risk = "moderate"
        message = "Tomorrow may need a little extra support. A small routine and one grounding exercise could help."
    else:
        risk = "low"
        message = "Your near-term pattern looks steady. Keep protecting the habits that are working."

    return {
        "available": True,
        "next_mood_score": round(mood_forecast, 2),
        "next_stress_level": round(stress_forecast, 2),
        "risk_level": risk,
        "message": message,
        "basis": "Weighted moving average plus recent linear trend over the latest check-ins.",
    }
