"""
NLP service for sentiment analysis, keyword extraction, and emotion classification.

The app prefers local NLTK resources when they are available, but it also stays
usable in offline or restricted environments by falling back to lightweight
tokenization, stopwords, and lemmatization behavior.
"""
import re

import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_BASIC_STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from",
    "had", "has", "have", "he", "her", "here", "him", "his", "i", "if",
    "in", "into", "is", "it", "its", "me", "my", "of", "on", "or", "our",
    "she", "so", "that", "the", "their", "them", "there", "they", "this",
    "to", "was", "we", "were", "with", "you", "your",
}


def _has_resource(path: str) -> bool:
    try:
        nltk.data.find(path)
        return True
    except LookupError:
        return False


_HAS_PUNKT = _has_resource("tokenizers/punkt")
_HAS_STOPWORDS = _has_resource("corpora/stopwords")
_HAS_WORDNET = _has_resource("corpora/wordnet")

_vader = SentimentIntensityAnalyzer()
_lemmatizer = WordNetLemmatizer()

try:
    _STOPWORDS = set(stopwords.words("english")) if _HAS_STOPWORDS else _BASIC_STOPWORDS
except Exception:
    _STOPWORDS = _BASIC_STOPWORDS


def _tokenize(text: str) -> list[str]:
    if _HAS_PUNKT:
        try:
            return word_tokenize(text)
        except Exception:
            pass
    return re.findall(r"[a-zA-Z']+", text)


def _lemmatize(token: str) -> str:
    if not _HAS_WORDNET:
        return token
    try:
        return _lemmatizer.lemmatize(token)
    except Exception:
        return token


EMOTION_LEXICON = {
    "joy": ["happy", "joyful", "excited", "great", "wonderful", "elated", "cheerful", "glad", "pleased", "thrilled"],
    "sadness": ["sad", "depressed", "unhappy", "miserable", "hopeless", "crying", "grief", "sorry", "lonely", "empty"],
    "anger": ["angry", "furious", "frustrated", "irritated", "annoyed", "rage", "mad", "hostile", "bitter"],
    "fear": ["afraid", "scared", "anxious", "worried", "terrified", "nervous", "panic", "dread", "uneasy"],
    "disgust": ["disgusted", "sick", "repulsed", "awful", "horrible", "nasty", "revolting"],
    "surprise": ["surprised", "shocked", "amazed", "astonished", "unexpected", "stunned"],
    "neutral": ["okay", "fine", "alright", "normal", "usual", "average", "moderate"],
    "exhaustion": ["tired", "exhausted", "drained", "fatigue", "sleepy", "worn", "burnout", "overwhelmed"],
}


def _preprocess(text: str) -> list[str]:
    """Tokenize, lowercase, remove noise, and lemmatize with safe fallbacks."""
    text = re.sub(r"[^a-zA-Z\s']", " ", text.lower())
    tokens = _tokenize(text)
    tokens = [token for token in tokens if token.isalpha() and len(token) > 2]
    tokens = [token for token in tokens if token not in _STOPWORDS]
    tokens = [_lemmatize(token) for token in tokens]
    return tokens


def _detect_emotion(tokens: list[str]) -> str:
    """Return dominant emotion based on lexicon matching."""
    scores = {emotion: 0 for emotion in EMOTION_LEXICON}
    for token in tokens:
        for emotion, words in EMOTION_LEXICON.items():
            if token in words:
                scores[emotion] += 1
    best = max(scores, key=scores.get)
    if scores[best] == 0:
        return "neutral"
    return best


def _emotional_intensity(vader_compound: float, subjectivity: float) -> float:
    """Estimate how strongly emotion is being expressed on a 0-1 scale."""
    intensity = (abs(vader_compound) * 0.6) + (subjectivity * 0.4)
    return round(min(intensity, 1.0), 4)


def _extract_keywords(tokens: list[str], top_n: int = 8) -> list[str]:
    """Return the most meaningful tokens using a simple frequency ranking."""
    freq: dict[str, int] = {}
    for token in tokens:
        freq[token] = freq.get(token, 0) + 1
    sorted_tokens = sorted(freq.items(), key=lambda item: item[1], reverse=True)
    return [word for word, _ in sorted_tokens[:top_n]]


def _composite_score(
    emotional_state: int,
    stress_level: int,
    cognitive_load: int,
    motivation_level: int,
    vader_compound: float,
) -> float:
    """
    Weighted composite emotional score on a 1-5 scale.
    Higher values indicate a more positive emotional state.
    """
    stress_inv = 6 - stress_level
    cog_inv = 6 - cognitive_load
    nlp_norm = ((vader_compound + 1) / 2 * 4) + 1

    score = (
        emotional_state * 0.40 +
        motivation_level * 0.25 +
        stress_inv * 0.20 +
        cog_inv * 0.10 +
        nlp_norm * 0.05
    )
    return round(min(max(score, 1.0), 5.0), 3)


def analyze(
    text: str | None,
    emotional_state: int,
    stress_level: int,
    cognitive_load: int,
    motivation_level: int,
) -> dict:
    """Run the full NLP analysis pipeline and return a dict matching the schema."""
    if not text or not text.strip():
        text = ""

    blob = TextBlob(text) if text else None
    polarity = round(blob.sentiment.polarity, 4) if blob else 0.0
    subjectivity = round(blob.sentiment.subjectivity, 4) if blob else 0.0

    vader_scores = _vader.polarity_scores(text) if text else {"compound": 0.0}
    vader_compound = round(vader_scores["compound"], 4)

    tokens = _preprocess(text) if text else []
    dominant_emotion = _detect_emotion(tokens)
    keywords = _extract_keywords(tokens)
    emotional_intensity = _emotional_intensity(vader_compound, subjectivity)

    if not text:
        if stress_level >= 4:
            dominant_emotion = "fear"
        elif emotional_state <= 2:
            dominant_emotion = "sadness"
        elif emotional_state >= 4 and motivation_level >= 4:
            dominant_emotion = "joy"

    composite = _composite_score(
        emotional_state,
        stress_level,
        cognitive_load,
        motivation_level,
        vader_compound,
    )

    return {
        "sentiment_polarity": polarity,
        "sentiment_subjectivity": subjectivity,
        "vader_compound": vader_compound,
        "emotional_intensity": emotional_intensity,
        "dominant_emotion": dominant_emotion,
        "keywords": keywords,
        "composite_score": composite,
    }
