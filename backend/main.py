"""
MindTrack — FastAPI Main Application
Early Emotional Assessment System based on CBT & NLP
Disclaimer: This is not a medical tool.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine, ensure_schema
from routers import checkin, dashboard, reports, memory

# Create all DB tables on startup
Base.metadata.create_all(bind=engine)
ensure_schema()

app = FastAPI(
    title="MindTrack API",
    description=(
        "AI-based Mental Health Chatbot — Early Emotional Assessment via "
        "short-term NLP-driven micro-interactions. "
        "⚠️ NOT a medical device. For informational use only."
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ── CORS — allow the Next.js dev server + Firebase Hosting ───────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "https://mindtrack-ai-app.web.app",
        "https://mindtrack-ai-app.firebaseapp.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(checkin.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(memory.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "service": "MindTrack API",
        "status": "running",
        "disclaimer": "This is not a medical tool. Seek professional help for clinical concerns.",
        "docs": "/api/docs",
    }


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "ok"}
