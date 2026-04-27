"""
Optional OpenAI reflection layer.

The app remains fully functional without OPENAI_API_KEY. When configured, this
adds a short supportive reflection on top of the rule-based CBT response.
"""
import os


def generate_reflection(
    *,
    text_response: str | None,
    nlp: dict,
    cbt: dict,
    profile_context: str,
) -> str | None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    try:
        from openai import OpenAI
    except Exception:
        return None

    model = os.getenv("OPENAI_MODEL", "gpt-5")
    client = OpenAI(api_key=api_key)
    prompt = (
        "You are adding a brief supportive reflection to a mental wellness check-in app. "
        "Do not diagnose. Do not claim to provide treatment. Keep it under 90 words. "
        "Use warm, concrete language. Respect the rule-based CBT category and safety disclaimer.\n\n"
        f"User reflection: {text_response or '(no free-text reflection)'}\n"
        f"Dominant emotion: {nlp.get('dominant_emotion')}\n"
        f"VADER sentiment: {nlp.get('vader_compound')}\n"
        f"Keywords: {', '.join(nlp.get('keywords') or [])}\n"
        f"CBT category: {cbt.get('category')}\n"
        f"Personalization context: {profile_context}\n"
    )

    try:
        response = client.responses.create(
            model=model,
            input=prompt,
        )
        text = getattr(response, "output_text", None)
        return text.strip() if text else None
    except Exception:
        return None
