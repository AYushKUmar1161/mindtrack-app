"""
Trend analysis service for short-term emotional pattern detection.
"""
import math


def _exponential_weights(n: int, decay: float = 0.85) -> list[float]:
    """Generate normalized exponential weights so recent entries matter more."""
    weights = [decay ** (n - 1 - i) for i in range(n)]
    total = sum(weights)
    return [weight / total for weight in weights]


def _weighted_avg(values: list[float], weights: list[float]) -> float:
    return round(sum(value * weight for value, weight in zip(values, weights)), 4)


def _std_dev(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    mean = sum(values) / len(values)
    variance = sum((value - mean) ** 2 for value in values) / (len(values) - 1)
    return math.sqrt(variance)


def _variability_score(series: list[float]) -> float:
    """Normalize emotional variability to a 0-1 range."""
    if len(series) < 2:
        return 0.0
    sd = _std_dev(series)
    return round(min(sd / 2.0, 1.0), 4)


def _detect_mood_swings(emotional_states: list[float], threshold: float = 2.0) -> bool:
    """Flag if any consecutive pair differs by at least the threshold."""
    for index in range(1, len(emotional_states)):
        if abs(emotional_states[index] - emotional_states[index - 1]) >= threshold:
            return True
    return False


def _detect_stress_spike(stress_levels: list[float], spike_value: int = 4, window: int = 3) -> bool:
    """True only when a full rolling window shows sustained high stress."""
    if len(stress_levels) < window:
        return False
    recent = stress_levels[-window:]
    return (sum(recent) / len(recent)) >= spike_value


def _trend_direction(composite_scores: list[float]) -> str:
    """Compare the first half vs second half mean to infer direction."""
    if len(composite_scores) < 3:
        return "stable"
    midpoint = len(composite_scores) // 2
    first = sum(composite_scores[:midpoint]) / midpoint
    second_half = composite_scores[midpoint:]
    second = sum(second_half) / len(second_half)
    delta = second - first
    if delta > 0.3:
        return "improving"
    if delta < -0.3:
        return "declining"
    return "stable"


def _generate_insight(
    trend: str,
    variability: float,
    mood_swing: bool,
    stress_spike: bool,
    avg_stress: float,
    avg_emotion: float,
    days: int,
) -> str:
    insights = []

    if trend == "improving":
        insights.append("Your mood has been improving steadily.")
    elif trend == "declining":
        insights.append("Your emotional state has been declining over recent days.")
    else:
        insights.append("Your emotional state has been relatively stable.")

    if stress_spike:
        insights.append("A sustained stress spike has been detected in recent days.")
    elif avg_stress >= 3.5:
        insights.append("Your average stress level is elevated.")
    elif avg_stress <= 2.0:
        insights.append("Your stress levels look well-managed.")

    if mood_swing or variability > 0.6:
        insights.append("Significant mood variability is showing up in the recent data.")
    elif variability < 0.2:
        insights.append("Your emotional state is fairly consistent.")

    if avg_emotion >= 4.0:
        insights.append("Overall, you have been in a positive emotional space.")
    elif avg_emotion <= 2.0:
        insights.append("Your overall emotional state has been low, so extra support may help.")

    if days >= 14:
        insights.append(f"{days} days tracked. You now have a reliable short-term profile.")
    elif days >= 7:
        insights.append(f"{days} days tracked. Early patterns are starting to emerge.")

    return " | ".join(insights)


def compute(checkins: list[dict]) -> dict:
    """
    Compute a trend summary from chronological check-ins.
    Returns a dict shaped like EmotionalTrend minus id and session_id.
    """
    if not checkins:
        return {
            "avg_emotional_state": None,
            "avg_stress": None,
            "avg_cognitive_load": None,
            "avg_motivation": None,
            "avg_sentiment": None,
            "variability_score": None,
            "mood_swing_detected": False,
            "stress_spike_detected": False,
            "trend_direction": "stable",
            "insight_message": "Not enough data yet. Check in daily to see your trends emerge.",
            "days_tracked": 0,
        }

    n = len(checkins)
    weights = _exponential_weights(n)

    emotional_states = [float(checkin["emotional_state"]) for checkin in checkins]
    stresses = [float(checkin["stress_level"]) for checkin in checkins]
    cognitive_loads = [float(checkin["cognitive_load"]) for checkin in checkins]
    motivations = [float(checkin["motivation_level"]) for checkin in checkins]
    sentiments = [float(checkin["vader_compound"] or 0.0) for checkin in checkins]
    composites = [float(checkin["composite_score"] or checkin["emotional_state"]) for checkin in checkins]

    avg_emotion = _weighted_avg(emotional_states, weights)
    avg_stress = _weighted_avg(stresses, weights)
    avg_cognitive = _weighted_avg(cognitive_loads, weights)
    avg_motivation = _weighted_avg(motivations, weights)
    avg_sentiment = _weighted_avg(sentiments, weights)

    variability = _variability_score(emotional_states)
    mood_swing = _detect_mood_swings(emotional_states)

    if n < 3:
        early_insights = [
            f"{n} day{'s' if n != 1 else ''} tracked so far. Keep checking in daily to unlock reliable trend detection.",
        ]
        if avg_stress >= 4.0:
            early_insights.append("Today's stress looks elevated. A grounding break could help.")
        elif avg_emotion <= 2.0:
            early_insights.append("Today's emotional state looks low. Extra support could help.")
        elif avg_emotion >= 4.0:
            early_insights.append("Today's emotional state looks positive. Keep protecting what is helping.")

        return {
            "avg_emotional_state": avg_emotion,
            "avg_stress": avg_stress,
            "avg_cognitive_load": avg_cognitive,
            "avg_motivation": avg_motivation,
            "avg_sentiment": avg_sentiment,
            "variability_score": variability,
            "mood_swing_detected": mood_swing,
            "stress_spike_detected": False,
            "trend_direction": "stable",
            "insight_message": " | ".join(early_insights),
            "days_tracked": n,
        }

    stress_spike = _detect_stress_spike(stresses)
    trend = _trend_direction(composites)
    insight = _generate_insight(
        trend,
        variability,
        mood_swing,
        stress_spike,
        avg_stress,
        avg_emotion,
        n,
    )

    return {
        "avg_emotional_state": avg_emotion,
        "avg_stress": avg_stress,
        "avg_cognitive_load": avg_cognitive,
        "avg_motivation": avg_motivation,
        "avg_sentiment": avg_sentiment,
        "variability_score": variability,
        "mood_swing_detected": mood_swing,
        "stress_spike_detected": stress_spike,
        "trend_direction": trend,
        "insight_message": insight,
        "days_tracked": n,
    }
