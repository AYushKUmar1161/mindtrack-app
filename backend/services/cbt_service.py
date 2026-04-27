"""
CBT Response Engine
Generates adaptive, empathetic responses based on emotional state,
using Cognitive Behavioral Therapy principles.
Categories: grounding | activation | coping | reinforcement | crisis_alert
"""
import random

# ── Response Templates ────────────────────────────────────────────────────────
RESPONSES = {
    "grounding": {
        "messages": [
            "I can sense you're carrying a heavy load right now. Let's slow down together.",
            "High stress can feel overwhelming — but you've handled hard days before. You've got this.",
            "Your mind is working overtime. Let's bring you back to the present, one breath at a time.",
            "Feeling stressed is your mind's way of asking for a pause. Let's give it one.",
        ],
        "exercises": [
            "🌿 **5-4-3-2-1 Grounding**: Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. This anchors you to the present moment.",
            "🫁 **Box Breathing**: Inhale for 4 counts → Hold for 4 → Exhale for 4 → Hold for 4. Repeat 4 times. It activates your parasympathetic nervous system.",
            "🧘 **Progressive Muscle Relaxation**: Starting from your toes, tense each muscle group for 5 seconds, then release. Work your way up to your head.",
            "🌊 **Cold Water Reset**: Splash cold water on your face or hold ice — it triggers the diver reflex, immediately slowing your heart rate.",
        ],
        "affirmations": [
            "This feeling is temporary. You are stronger than this moment.",
            "You have survived every difficult day so far. Today is no different.",
            "It's okay to not be okay. Accepting where you are is the first step.",
            "One breath at a time. One moment at a time. You are here.",
        ],
    },

    "activation": {
        "messages": [
            "Low energy days are hard, but small actions create momentum. Let's find one tiny step.",
            "Motivation often follows action — not the other way around. Let's start small.",
            "Your drive may feel distant, but it hasn't left you. Let's reconnect with what matters.",
            "It's okay to rest, but let's make sure rest isn't becoming avoidance. Together we'll explore.",
        ],
        "exercises": [
            "✅ **Behavioral Activation**: Write down ONE small, achievable thing you can do in the next 10 minutes. Completing it builds momentum.",
            "🎯 **Values Check-In**: What was something meaningful to you in happier times? Write 2 sentences about it. Reconnecting with values reignites motivation.",
            "🚶 **5-Minute Walk**: Step outside for 5 minutes. No phone. Physical movement shifts brain chemistry and breaks inertia.",
            "📝 **Accomplishment List**: Write 3 things you did today — however small. Getting dressed counts. This counters the negativity bias.",
        ],
        "affirmations": [
            "Small steps taken consistently create massive change. Start anywhere.",
            "You don't have to feel motivated to act. Acting creates the feeling.",
            "Your worth isn't measured by your productivity. You matter as you are.",
            "Every master was once a beginner who simply didn't give up.",
        ],
    },

    "coping": {
        "messages": [
            "You're navigating some turbulence — that takes real strength. Let's build your toolkit.",
            "Mixed emotions are a sign of a complex, aware mind. Let's work through this together.",
            "It sounds like today is asking a lot of you. Let's find ways to soften that load.",
            "Managing cognitive load means knowing when to ask for help. That's wisdom, not weakness.",
        ],
        "exercises": [
            "🧩 **Cognitive Restructuring**: Identify one negative thought you're having. Ask: Is this 100% true? What would I tell a friend thinking this?",
            "📔 **Thought Record**: Write down the situation → your automatic thought → how it made you feel → a balanced alternative thought.",
            "⏱️ **Worry Time**: Schedule 15 minutes to worry deliberately, then close it. Outside that window, postpone worries firmly.",
            "🎨 **Creative Expression**: Draw, write, or hum for 5 minutes without judgment. Creative outlets externalize internal tension.",
        ],
        "affirmations": [
            "You are not your thoughts. You are the observer of your thoughts.",
            "Difficulty is not a signal to stop — it's a signal to adapt.",
            "You are doing better than you think. Growth is rarely visible from the inside.",
            "Every challenge you face is building resilience you'll use tomorrow.",
        ],
    },

    "reinforcement": {
        "messages": [
            "You're doing really well — your emotional balance is showing. Keep nurturing this.",
            "Stability is an achievement. Many people don't realize how much work it takes to feel okay.",
            "You're in a good space right now. Let's use this moment to build habits that sustain you.",
            "Your consistent effort is paying off. This is what emotional health looks like — keep going.",
        ],
        "exercises": [
            "🌟 **Gratitude Practice**: Write 3 specific things you're grateful for today. Specificity is key — it deepens the positive neural pathways.",
            "💬 **Positive Self-Talk**: Spend 2 minutes speaking kindly to yourself as you would to your best friend.",
            "🔮 **Future Visualization**: Close your eyes and vividly imagine your best possible self 1 year from now. Hold that image for 3 minutes.",
            "🤝 **Connection Ritual**: Reach out to one person you care about today — even a brief message strengthens your support network.",
        ],
        "affirmations": [
            "You've built this stability through consistent choices. Be proud of that.",
            "Your emotional health is a gift — to yourself and to everyone around you.",
            "Feeling good is sustainable when you keep choosing habits that serve you.",
            "You are exactly where you need to be. Keep growing.",
        ],
    },

    "crisis_alert": {
        "messages": [
            "I'm genuinely concerned about how you're feeling. Please know you're not alone in this.",
            "What you're experiencing sounds very difficult. You deserve real support right now.",
            "Reaching out is the bravest thing you can do when things are this hard. Please do.",
        ],
        "exercises": [
            "📞 **Please reach out**: Contact a mental health professional or crisis line. You deserve real human support.",
        ],
        "affirmations": [
            "You matter. Your life has value. Please reach out for help.",
            "Asking for help is the strongest thing you can do right now.",
        ],
    },
}

CRISIS_RESOURCES = (
    "\n\n---\n⚠️ **Important**: If you are in distress, please contact a mental health professional "
    "or call a crisis helpline. **India**: iCall: 9152987821 | **US**: 988 Suicide & Crisis Lifeline: 988 | "
    "**International**: findahelpline.com"
)

DISCLAIMER = (
    "\n\n*This app is not a medical tool and does not replace professional mental health care. "
    "If you're experiencing severe distress, please seek help from a qualified professional.*"
)


def _select_category(
    stress_level: int,
    emotional_state: int,
    motivation_level: int,
    cognitive_load: int,
    vader_compound: float,
    dominant_emotion: str,
    trend_direction: str | None = None,
) -> str:
    """Determine which CBT response category to use."""

    # Crisis threshold
    if (stress_level == 5 and emotional_state == 1) or vader_compound < -0.7:
        return "crisis_alert"

    # High stress → grounding
    if stress_level >= 4 or (stress_level == 3 and emotional_state <= 2):
        return "grounding"

    # Low motivation → behavioral activation
    if motivation_level <= 2 or emotional_state <= 2:
        return "activation"

    # High cognitive load with moderate stress → coping
    if cognitive_load >= 4:
        return "coping"

    # Negative trend despite okay current state → coping
    if trend_direction == "declining" and emotional_state <= 3:
        return "coping"

    # Stable and positive → reinforcement
    if emotional_state >= 4 and stress_level <= 2 and motivation_level >= 3:
        return "reinforcement"

    # Default: coping for anything in-between
    return "coping"


def generate(
    stress_level: int,
    emotional_state: int,
    motivation_level: int,
    cognitive_load: int,
    vader_compound: float = 0.0,
    dominant_emotion: str = "neutral",
    trend_direction: str | None = None,
) -> dict:
    """
    Generate a CBT-based adaptive response.
    Returns: {category, message, exercise, affirmation}
    """
    category = _select_category(
        stress_level, emotional_state, motivation_level,
        cognitive_load, vader_compound, dominant_emotion, trend_direction
    )

    pool = RESPONSES[category]
    message     = random.choice(pool["messages"])
    exercise    = random.choice(pool["exercises"])
    affirmation = random.choice(pool["affirmations"])

    # Append crisis resources if needed
    suffix = ""
    if category == "crisis_alert":
        suffix = CRISIS_RESOURCES
    suffix += DISCLAIMER

    return {
        "category":    category,
        "message":     message + suffix,
        "exercise":    exercise,
        "affirmation": affirmation,
    }
