"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { submitCheckin, getTodayStatus } from "../../lib/api";
import BreathingExercise from "../../components/BreathingExercise";
import { SparklesCore } from "../../components/ui/sparkles";

const QUESTIONS = [
  {
    key: "emotional_state",
    label: "Emotional State",
    question: "How would you rate your overall emotional state today?",
    low: "Very Low",
    high: "Excellent",
    icon: "😊",
  },
  {
    key: "stress_level",
    label: "Stress Level",
    question: "How stressed have you felt today?",
    low: "No Stress",
    high: "Extremely Stressed",
    icon: "⚡",
  },
  {
    key: "cognitive_load",
    label: "Cognitive Load",
    question: "How mentally demanding or overloaded do you feel?",
    low: "Clear Mind",
    high: "Overwhelmed",
    icon: "🧩",
  },
  {
    key: "motivation_level",
    label: "Motivation Level",
    question: "How motivated and driven do you feel today?",
    low: "No Drive",
    high: "Highly Motivated",
    icon: "🎯",
  },
];

function ScaleQuestion({ q, value, onChange }) {
  return (
    <div className="scale-group fade-up">
      <div className="scale-label">
        <div>
          <span style={{ marginRight: 8, fontSize: 20 }}>{q.icon}</span>
          <span className="scale-label-text">{q.label}</span>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{q.question}</p>
        </div>
        <span className="scale-value">{value ?? "—"}</span>
      </div>

      {/* Scale buttons 1–5 */}
      <div className="scale-buttons">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            className={`scale-btn${value === n ? " active" : ""}`}
            onClick={() => onChange(n)}
            type="button"
          >
            {n}
          </button>
        ))}
      </div>

      {/* Low / High labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--text-dim)" }}>
        <span>1 = {q.low}</span>
        <span>5 = {q.high}</span>
      </div>

      {/* Animated fill bar */}
      <div className="progress-bar" style={{ marginTop: 10 }}>
        <div className="progress-fill" style={{ width: value ? `${(value / 5) * 100}%` : "0%" }} />
      </div>
    </div>
  );
}

const STEPS = ["Questions", "Reflection", "Response"];

export default function CheckinPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0=scale q's, 1=text q, 2=result
  const [sessionId, setSessionId] = useState(null);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [showBreathing, setShowBreathing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const [answers, setAnswers] = useState({
    emotional_state: null,
    stress_level: null,
    cognitive_load: null,
    motivation_level: null,
  });
  const [textResponse, setTextResponse] = useState("");
  const [result, setResult] = useState(null);

  // Load or create session ID from localStorage
  useEffect(() => {
    let sid = localStorage.getItem("mindtrack_session");
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem("mindtrack_session", sid);
    }
    setSessionId(sid);
  }, []);

  // Check if already checked in today
  useEffect(() => {
    if (!sessionId) return;
    getTodayStatus(sessionId)
      .then((r) => {
        if (r.data.checked_in) {
          setAlreadyDone(true);
          setStep(2);
          setResult(r.data.checkin);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  const allScalesAnswered = QUESTIONS.every((q) => answers[q.key] !== null);

  const handleScaleContinue = () => {
    if (answers.stress_level >= 4) {
      setShowBreathing(true);
      setStep(1); // advance to reflection step, breathing will show there
    } else {
      setStep(1);
    }
  };

  const toggleListening = useCallback(() => {
    // If already listening — stop it
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false; // only fire on final results — avoids duplicate appending
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      if (transcript) {
        // Functional setState so we always append to the latest value
        setTextResponse((prev) => {
          const sep = prev.length > 0 && !prev.endsWith(" ") ? " " : "";
          return prev + sep + transcript;
        });
      }
    };

    recognition.onerror = (e) => {
      console.error("Speech recognition error:", e.error);
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  const handleSubmit = useCallback(async () => {
    if (!allScalesAnswered || !sessionId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitCheckin({
        session_id: sessionId,
        ...answers,
        text_response: textResponse || null,
      });
      setResult(res.data);
      setStep(2);
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [answers, textResponse, sessionId, allScalesAnswered]);

  if (loading) {
    return (
      <div className="loader-page">
        <div className="loader" />
        <span>Loading your session…</span>
      </div>
    );
  }

  const CBT_ICONS = {
    grounding: "🌿",
    activation: "⚡",
    coping: "🧩",
    reinforcement: "🌟",
    crisis_alert: "🚨",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", position: "relative" }}>
      {/* Sparkles background */}
      <div style={{
        position: "fixed", inset: 0,
        zIndex: 0, pointerEvents: "none",
        opacity: 0.4,
      }}>
        <SparklesCore
          id="checkin-sparkles"
          background="transparent"
          minSize={0.3}
          maxSize={1.0}
          particleDensity={50}
          particleColor="#ffffff"
          speed={0.8}
        />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
      <Navbar />
      <div className="page">
        <div className="container" style={{ maxWidth: 680 }}>

          {/* Progress steps */}
          <div style={{ display: "flex", gap: 8, marginBottom: 36, alignItems: "center" }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28, height: 28,
                  borderRadius: "50%",
                  background: step >= i ? "var(--text)" : "var(--bg-3)",
                  border: `1px solid ${step >= i ? "var(--text)" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: step >= i ? "var(--bg)" : "var(--text-dim)",
                  transition: "all 0.3s ease",
                }}>
                  {step > i ? "✓" : i + 1}
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 500,
                  color: step === i ? "var(--text)" : "var(--text-dim)",
                }}>
                  {s}
                </span>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 32, height: 1, background: "var(--border)", marginLeft: 4 }} />
                )}
              </div>
            ))}
          </div>

          {/* ── Step 0: Scale questions ── */}
          {step === 0 && (
            <div className="fade-up">
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 6 }}>
                Daily Check-in
              </h1>
              <p style={{ color: "var(--text-muted)", marginBottom: 36, fontSize: 14 }}>
                Rate how you feel today on each dimension. Be honest — this is for you.
              </p>

              <div className="card" style={{ padding: "32px" }}>
                {QUESTIONS.map((q) => (
                  <ScaleQuestion
                    key={q.key}
                    q={q}
                    value={answers[q.key]}
                    onChange={(v) => setAnswers((prev) => ({ ...prev, [q.key]: v }))}
                  />
                ))}

                {error && <div className="alert alert-danger">{error}</div>}

                <button
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
                  disabled={!allScalesAnswered}
                  onClick={handleScaleContinue}
                >
                  Continue to Reflection →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 1: Open-ended text ── */}
          {step === 1 && (
            <div className="fade-up">
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 6 }}>
                Free Reflection
              </h1>
              <p style={{ color: "var(--text-muted)", marginBottom: 36, fontSize: 14 }}>
                Share what&apos;s on your mind. A sentence is enough — or say as much as you need.
              </p>

              {showBreathing ? (
                <div className="card" style={{ padding: 0 }}>
                  <BreathingExercise onComplete={() => setShowBreathing(false)} />
                </div>
              ) : (
                <div className="card" style={{ padding: 32 }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
                      <p style={{ fontSize: 16, fontWeight: 600 }}>
                        💭 How would you describe your day in your own words?
                      </p>
                      <button 
                        className={`btn btn-sm ${isListening ? "btn-danger" : "btn-secondary"}`}
                        onClick={toggleListening}
                      >
                        {isListening ? "🔴 Recording..." : "🎙️ Voice Typing"}
                      </button>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
                      This is optional but helps the AI understand your emotional context better.
                    </p>
                    <textarea
                      className={`form-textarea ${isListening ? "listening-active" : ""}`}
                      placeholder="Today I felt... / I'm struggling with... / Something good happened..."
                      value={textResponse}
                      onChange={(e) => setTextResponse(e.target.value)}
                      rows={5}
                      maxLength={2000}
                      style={isListening ? { borderColor: "var(--text)", boxShadow: "0 0 0 1px var(--text)" } : {}}
                    />
                    <div style={{ textAlign: "right", fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>
                      {textResponse.length}/2000
                    </div>
                  </div>

                  {/* Score summary */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 8,
                  padding: "16px",
                  background: "var(--bg-3)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: 20,
                }}>
                  {QUESTIONS.map((q) => (
                    <div key={q.key} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "var(--text-muted)" }}>{q.icon} {q.label}</span>
                      <span style={{ fontWeight: 700, fontFamily: "JetBrains Mono, monospace" }}>
                        {answers[q.key]}/5
                      </span>
                    </div>
                  ))}
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <div style={{ display: "flex", gap: 12 }}>
                  <button className="btn btn-secondary" onClick={() => setStep(0)}>← Back</button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: "center" }}
                    disabled={submitting}
                    onClick={handleSubmit}
                  >
                    {submitting ? (
                      <><div className="loader" style={{ width: 16, height: 16, borderWidth: 2 }} /> Analyzing…</>
                    ) : (
                      "Submit & Get Response →"
                    )}
                  </button>
                </div>
              </div>
              )}
            </div>
          )}

          {/* ── Step 2: CBT Response ── */}
          {step === 2 && result && (
            <div className="fade-up">
              {alreadyDone && (
                <div className="alert alert-info" style={{ marginBottom: 24 }}>
                  ✅ You&apos;ve already checked in today. Here&apos;s your response from earlier.
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <span style={{ fontSize: 36 }}>
                  {CBT_ICONS[result.cbt_category] || "💬"}
                </span>
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>
                    Your Personalised Response
                  </h1>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                    Based on your emotional profile today
                  </p>
                </div>
              </div>

              {/* Scores */}
              <div className="card" style={{ marginBottom: 16, padding: "20px 24px" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                  Today&apos;s Profile
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                  {QUESTIONS.map((q) => {
                    const val = result[q.key];
                    return (
                      <div key={q.key} style={{
                        display: "flex", justifyContent: "space-between",
                        padding: "10px 14px",
                        background: "var(--bg-3)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: 13,
                      }}>
                        <span style={{ color: "var(--text-muted)" }}>{q.icon} {q.label}</span>
                        <span style={{ fontWeight: 700, fontFamily: "JetBrains Mono, monospace" }}>{val}/5</span>
                      </div>
                    );
                  })}
                </div>
                {result.dominant_emotion && (
                  <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span className="badge badge-dark">🎭 {result.dominant_emotion}</span>
                    {result.cbt_category && (
                      <span className="badge badge-dark">📋 {result.cbt_category}</span>
                    )}
                    {result.composite_score && (
                      <span className="badge badge-dark">
                        ⚡ Composite: {Number(result.composite_score).toFixed(2)}/5
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* CBT Response */}
              <div className="card" style={{ marginBottom: 16, borderLeft: "3px solid var(--text)" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                  AI Response
                </p>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-muted)", whiteSpace: "pre-wrap" }}>
                  {result.cbt_response}
                </p>
              </div>

              {result.ai_reflection && (
                <div className="card" style={{ marginBottom: 16, borderLeft: "3px solid var(--ok)" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                    Hybrid AI Reflection
                  </p>
                  <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-muted)" }}>
                    {result.ai_reflection}
                  </p>
                </div>
              )}

              {result.explainability && (
                <div className="card" style={{ marginBottom: 16, padding: "16px 24px" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                    Why this response?
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                    <span className="badge badge-dark">Emotion: {result.explainability.emotion}</span>
                    <span className="badge badge-dark">Sentiment: {result.explainability.sentiment ?? "—"}</span>
                    <span className="badge badge-dark">Category: {result.explainability.response_category || "—"}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 8 }}>
                    {result.explainability.reason}
                  </p>
                  {(result.explainability.triggers || []).slice(0, 3).map((trigger) => (
                    <div key={trigger} className="insight-segment">{trigger}</div>
                  ))}
                </div>
              )}

              {result.interventions?.length > 0 && (
                <div className="card" style={{ marginBottom: 16, padding: "16px 24px" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                    Smart Interventions
                  </p>
                  <div style={{ display: "grid", gap: 8 }}>
                    {result.interventions.map((item) => (
                      <div key={item.type} style={{ background: "var(--bg-3)", borderRadius: "var(--radius-sm)", padding: "12px 14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                          <strong style={{ fontSize: 13 }}>{item.title}</strong>
                          <span className={`badge ${item.priority === "high" ? "badge-danger" : "badge-dark"}`}>{item.priority}</span>
                        </div>
                        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{item.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NLP Insight */}
              {result.vader_compound !== null && result.vader_compound !== undefined && (
                <div className="card" style={{ marginBottom: 24, padding: "16px 24px" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                    Sentiment Analysis
                  </p>
                  <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--text-dim)" }}>VADER Score</span>
                      <div style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700, marginTop: 2 }}>
                        {Number(result.vader_compound).toFixed(3)}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--text-dim)" }}>Polarity</span>
                      <div style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700, marginTop: 2 }}>
                        {Number(result.sentiment_polarity || 0).toFixed(3)}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "var(--text-dim)" }}>Intensity</span>
                      <div style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700, marginTop: 2 }}>
                        {result.emotional_intensity ? `${(result.emotional_intensity * 100).toFixed(0)}%` : "—"}
                      </div>
                    </div>
                  </div>
                  {result.keywords && (() => {
                    try {
                      const kw = typeof result.keywords === "string"
                        ? JSON.parse(result.keywords)
                        : result.keywords;
                      if (kw.length > 0) return (
                        <div style={{ marginTop: 12 }}>
                          <span style={{ fontSize: 11, color: "var(--text-dim)" }}>Keywords: </span>
                          {kw.slice(0, 8).map((k) => (
                            <span key={k} className="badge badge-dark" style={{ margin: "2px 4px 2px 0" }}>{k}</span>
                          ))}
                        </div>
                      );
                    } catch { return null; }
                  })()}
                </div>
              )}

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
                <button className="btn btn-primary" onClick={() => router.push("/")}>
                  🏠 Back to Home
                </button>
                <button className="btn btn-secondary" onClick={() => router.push("/dashboard")}>
                  📊 View Dashboard
                </button>
                {alreadyDone ? (
                  <button className="btn btn-ghost" onClick={() => router.push("/history")}>
                    View History
                  </button>
                ) : (
                  <button className="btn btn-ghost" onClick={() => {
                  setStep(0);
                  setAnswers({ emotional_state: null, stress_level: null, cognitive_load: null, motivation_level: null });
                  setTextResponse("");
                  setResult(null);
                  setAlreadyDone(false);
                }}>
                  ↩ New check-in
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
