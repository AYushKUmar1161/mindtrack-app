"""
Explainable AI panel data.
"""
import json


def _keywords(value) -> list[str]:
    if not value:
        return []
    if isinstance(value, list):
        return value
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


def build_explanation(
    *,
    emotional_state: int,
    stress_level: int,
    cognitive_load: int,
    motivation_level: int,
    sentiment_polarity: float | None,
    vader_compound: float | None,
    dominant_emotion: str | None,
    keywords,
    cbt_category: str | None,
) -> dict:
    triggers: list[str] = []

    if stress_level >= 4:
        triggers.append("Stress >= 4 triggered a grounding-style intervention.")
    if motivation_level <= 2:
        triggers.append("Motivation <= 2 triggered behavioral activation support.")
    if cognitive_load >= 4:
        triggers.append("Cognitive load >= 4 triggered coping and thought-organization support.")
    if emotional_state <= 2:
        triggers.append("Low mood increased support intensity.")
    if vader_compound is not None and vader_compound < -0.5:
        triggers.append("Negative text sentiment increased response sensitivity.")
    if not triggers:
        triggers.append("No high-risk threshold fired; response matched the overall emotional profile.")

    category_reason = {
        "grounding": "Grounding was selected to lower immediate physiological stress.",
        "activation": "Activation was selected to rebuild momentum through small actions.",
        "coping": "Coping was selected to organize thoughts and reduce mental load.",
        "reinforcement": "Reinforcement was selected to strengthen stable positive habits.",
        "crisis_alert": "Crisis routing was selected because the distress threshold was high.",
    }.get(cbt_category or "", "The response was selected from combined scale and sentiment signals.")

    return {
        "emotion": dominant_emotion or "neutral",
        "sentiment": vader_compound,
        "polarity": sentiment_polarity,
        "keywords": _keywords(keywords),
        "response_category": cbt_category,
        "triggers": triggers,
        "decision_path": [
            f"Mood={emotional_state}/5",
            f"Stress={stress_level}/5",
            f"Cognitive load={cognitive_load}/5",
            f"Motivation={motivation_level}/5",
            f"Emotion={dominant_emotion or 'neutral'}",
            f"Category={cbt_category or 'unknown'}",
        ],
        "reason": category_reason,
    }
