# 🧠 MindTrack — AI Mental Health Chatbot

> **Early Emotional Assessment System** using short-term NLP-driven micro-interactions and CBT-based adaptive responses.

> ⚠️ **DISCLAIMER:** This is not a medical tool. It does not replace professional mental health care. If you are in distress, please contact a licensed mental health professional.

---

## 📁 Project Structure

```
APP/
├── backend/
│   ├── main.py                    ← FastAPI app entry point
│   ├── database.py                ← SQLAlchemy + SQLite setup
│   ├── models.py                  ← ORM models (UserSession, DailyCheckin, EmotionalTrend)
│   ├── schemas.py                 ← Pydantic request/response schemas
│   ├── requirements.txt           ← Python dependencies
│   ├── seed_data.py               ← Generate 14-day demo dataset
│   ├── routers/
│   │   ├── checkin.py             ← POST/GET check-in endpoints
│   │   ├── dashboard.py           ← GET dashboard data
│   │   └── reports.py             ← GET PDF report + session info
│   └── services/
│       ├── nlp_service.py         ← TextBlob + VADER + NLTK NLP pipeline
│       ├── cbt_service.py         ← CBT adaptive response engine
│       ├── trend_service.py       ← Short-term trend analysis (10–15 days)
│       └── report_service.py      ← ReportLab PDF generator
│
├── frontend/
│   ├── package.json
│   ├── next.config.js             ← Next.js + API proxy config
│   └── src/
│       ├── app/
│       │   ├── layout.js          ← Root layout + metadata
│       │   ├── globals.css        ← Complete design system (dark theme)
│       │   ├── page.js            ← Landing page
│       │   ├── checkin/page.js    ← 3-step daily check-in flow
│       │   └── dashboard/page.js  ← Analytics dashboard
│       ├── components/
│       │   └── Navbar.jsx         ← Navigation bar with streak
│       └── lib/
│           └── api.js             ← Axios API client
│
└── README.md
```

---

## 🚀 Running Locally

### Prerequisites
- **Python** 3.10+
- **Node.js** 18+
- **pip** and **npm/npx**

---

### Step 1 — Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

API is now running at: **http://localhost:8000**
Swagger docs: **http://localhost:8000/api/docs**

MindTrack now uses local NLTK data when it is available and falls back
gracefully when those corpora are missing, so a network download is not
required just to start the API.

Optional OpenAI layer:
Set `OPENAI_API_KEY` before starting the backend if you want a short
OpenAI-generated reflection added on top of the rule-based CBT response.
You can also set `OPENAI_MODEL` to override the default model.

---

### Step 2 — Seed Demo Data (Optional)

```bash
cd backend
python seed_data.py
```

This creates **14 days** of synthetic check-in data for the demo session:
```
Session ID: demo-session-0000-0000-0000-000000000001
```
Use this session ID in the frontend localStorage to view pre-populated charts.

---

### Step 3 — Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js dev server
npm run dev
```

Frontend is now running at: **http://localhost:3000**

---

### Step 4 — Using the App

1. Open **http://localhost:3000**
2. Click **"Begin Daily Check-in"**
3. Rate all 4 dimensions (1–5 scale)
4. Write an optional free-text reflection
5. Submit → receive your **CBT-based adaptive response**
6. Visit **Dashboard** to view your emotional trends over time
7. Download a **PDF report** from the dashboard

> **Session IDs** are auto-generated and stored in browser `localStorage`. No PII is collected.

---

## 🧠 Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                     │
│  Landing Page → Check-in (3-step) → Dashboard (Recharts)     │
└─────────────────────────┬────────────────────────────────────┘
                          │  REST API (HTTP)
┌─────────────────────────▼────────────────────────────────────┐
│                       BACKEND (FastAPI)                        │
│                                                                │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Data Module │  │  NLP Module  │  │   Trend Module       │ │
│  │  (checkin   │→ │  TextBlob +  │→ │  Exponential weights │ │
│  │   router)   │  │  VADER+NLTK  │  │  Variability score   │ │
│  └─────────────┘  └──────────────┘  └──────────────────────┘ │
│                          │                     │               │
│                   ┌──────▼─────────────────────▼────────────┐ │
│                   │         CBT Response Engine              │ │
│                   │  grounding | activation | coping |       │ │
│                   │  reinforcement | crisis_alert            │ │
│                   └─────────────────────────────────────────┘ │
│                          │                                     │
│  ┌───────────────────────▼───────────────────────────────────┐│
│  │                SQLite Database (mindtrack.db)              ││
│  │  user_sessions | daily_checkins | emotional_trends        ││
│  └───────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/checkin` | Submit daily 5-question check-in |
| `GET`  | `/api/checkin/today` | Check if already checked in today |
| `GET`  | `/api/checkin/all` | Get all check-ins for a session |
| `GET`  | `/api/dashboard` | Full dashboard payload |
| `GET`  | `/api/memory/search` | Search past reflections and signals |
| `GET`  | `/api/report/csv` | Export raw check-in data as CSV |
| `GET`  | `/api/report/pdf` | Download PDF emotional report |
| `GET`  | `/api/report/session` | Session info (streak, etc.) |
| `GET`  | `/api/docs` | Swagger interactive API docs |

---

## 🧪 NLP Pipeline

```
Text Input
    ↓
Preprocessing (NLTK)
    ├── Tokenisation
    ├── Stopword removal
    └── Lemmatisation
    ↓
Sentiment Analysis
    ├── TextBlob → polarity (-1.0 to 1.0) + subjectivity (0 to 1)
    └── VADER   → compound score (-1.0 to 1.0)
    ↓
Feature Extraction
    ├── Dominant emotion (lexicon matching: joy, sadness, fear, anger, etc.)
    ├── Keyword extraction (top-8 meaningful tokens)
    └── Emotional intensity (VADER + subjectivity combined)
    ↓
Composite Score (1–5 scale)
    ├── Emotional state × 0.40
    ├── Motivation      × 0.25
    ├── Stress (inv)    × 0.20
    ├── Cognitive (inv) × 0.10
    └── NLP sentiment   × 0.05
```

---

## 📊 Trend Analysis

- Uses **exponential weighting** (decay = 0.85) — recent days matter more
- Detects **mood swings** (consecutive day diff ≥ 2)
- Detects **stress spikes** (3-day rolling average ≥ 4)
- Calculates **variability score** (normalised std dev of mood series)
- Determines **trend direction** (first-half vs second-half mean comparison)
- Generates **human-readable insight messages**

---

## 💬 CBT Response Categories

| State | Category | Response Type |
|-------|----------|---------------|
| Stress ≥ 4 | `grounding` | 5-4-3-2-1, Box breathing, PMR |
| Motivation ≤ 2 | `activation` | Behavioural activation, micro-goals |
| High cognitive load | `coping` | Cognitive restructuring, thought records |
| Positive & stable | `reinforcement` | Gratitude, visualisation, connection |
| Crisis threshold | `crisis_alert` | Hotline referral + safety resources |

---

## 🗄️ Database Schema

```sql
-- Anonymous session tracking (no PII)
user_sessions (
  id, session_id, created_at, streak_days, last_checkin_date
)

-- Daily 5-question check-ins + NLP analysis results
daily_checkins (
  id, session_id, checkin_date, timestamp,
  emotional_state, stress_level, cognitive_load, motivation_level,
  text_response,
  sentiment_polarity, sentiment_subjectivity, vader_compound,
  emotional_intensity, dominant_emotion, keywords, composite_score,
  cbt_response, cbt_category
)

-- Pre-computed trend summaries
emotional_trends (
  id, session_id, computed_at,
  avg_emotional_state, avg_stress, avg_cognitive_load,
  avg_motivation, avg_sentiment,
  variability_score, mood_swing_detected, stress_spike_detected,
  trend_direction, insight_message, days_tracked
)
```

---

## 🔒 Privacy & Ethics

- **No PII collected** — sessions are anonymous UUIDs generated in the browser
- **Local-first** — all data stays on your machine (SQLite)
- **Disclaimer shown** — on every page and in every PDF report
- **Crisis routing** — if stress=5 and mood=1, user is routed to crisis resources
- **Professional referral** — included in every CBT response footer

---

## 🌐 Deployment Suggestions

### Backend (FastAPI)
- **Render / Railway**: Set start command to `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Google Cloud Run**: Containerise with Docker
- **Fly.io**: Great for SQLite-based apps with persistent volumes

### Frontend (Next.js)
- **Vercel**: Connect GitHub repo, auto-deploys
- Set `NEXT_PUBLIC_API_URL=https://your-backend.com` and update `api.js`

### Environment Variables (production)
```env
# backend/.env
DATABASE_URL=sqlite:///./mindtrack.db
CORS_ORIGINS=https://your-frontend.vercel.app
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) |
| Styling | Vanilla CSS (black & white design system) |
| Charts | Recharts |
| Backend | FastAPI (Python 3.10+) |
| Database | SQLite + SQLAlchemy ORM |
| NLP | TextBlob + VADER Sentiment + NLTK |
| PDF | ReportLab |
| HTTP Client | Axios |

---

## 📞 Crisis Support Resources

If you or someone you know is in crisis:
- 🇮🇳 **iCall (India):** 9152987821
- 🇺🇸 **988 Suicide & Crisis Lifeline:** 988
- 🌍 **International:** findahelpline.com

---

*MindTrack — Not a medical device. Built for research and educational purposes.*

---

## Advanced AI Features

MindTrack now includes an adaptive intelligence layer:

- Personalization engine: tracks frequent emotions, stress direction, and time-of-day mood patterns.
- Predictive mood forecasting: estimates near-term mood and stress from recent weighted trends.
- Hybrid CBT + OpenAI reflections: keeps deterministic CBT safety rules, with an optional LLM reflection layer.
- Explainable AI panel: shows sentiment, emotion, keywords, thresholds, and response rationale.
- Smart interventions: maps high stress, low motivation, cognitive load, and forecast risk to UI actions.
- Wellness score: summarizes mood, stress balance, motivation, focus, weekly improvement, and stability.
- Second Brain search: lets users query past reflections by emotion, keyword, stress, or productivity.
- Voice check-in: uses the browser Web Speech API to turn speech into reflection text.

Optional OpenAI setup:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5
```

If `OPENAI_API_KEY` is missing, the app gracefully falls back to the local CBT engine.
