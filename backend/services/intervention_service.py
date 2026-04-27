"""
Smart intervention rules that connect AI signals to UI actions.
"""


def build_interventions(
    *,
    emotional_state: int,
    stress_level: int,
    cognitive_load: int,
    motivation_level: int,
    forecast: dict | None = None,
    profile: dict | None = None,
) -> list[dict]:
    interventions: list[dict] = []

    if stress_level >= 4:
        interventions.append({
            "type": "breathing",
            "title": "Regulate stress",
            "message": "Stress is high. Try a 60-second box breathing reset before continuing.",
            "action": "start_breathing",
            "priority": "high",
        })

    if motivation_level <= 2:
        interventions.append({
            "type": "micro_task",
            "title": "Restart momentum",
            "message": "Choose one task that takes less than 5 minutes. Completion matters more than size.",
            "action": "show_micro_task",
            "priority": "medium",
        })

    if cognitive_load >= 4:
        interventions.append({
            "type": "thought_dump",
            "title": "Reduce mental load",
            "message": "Write every open loop in a list, then circle only the next actionable item.",
            "action": "show_thought_dump",
            "priority": "medium",
        })

    if emotional_state <= 2:
        interventions.append({
            "type": "support_prompt",
            "title": "Add human support",
            "message": "Consider messaging one trusted person or planning a low-pressure check-in.",
            "action": "suggest_support",
            "priority": "medium",
        })

    if forecast and forecast.get("risk_level") in {"moderate", "high"}:
        interventions.append({
            "type": "forecast_plan",
            "title": "Plan for tomorrow",
            "message": forecast.get("message") or "Recent patterns suggest tomorrow may need extra support.",
            "action": "plan_recovery",
            "priority": "high" if forecast.get("risk_level") == "high" else "medium",
        })

    if profile:
        stress_pattern = profile.get("stress_pattern", {})
        if stress_pattern.get("direction") == "rising":
            interventions.append({
                "type": "pattern_break",
                "title": "Break the rising stress pattern",
                "message": "Your recent stress trend is rising. Schedule one non-negotiable recovery block.",
                "action": "schedule_break",
                "priority": "medium",
            })

    unique: list[dict] = []
    seen = set()
    for item in interventions:
        if item["type"] not in seen:
            unique.append(item)
            seen.add(item["type"])
    return unique[:4]
