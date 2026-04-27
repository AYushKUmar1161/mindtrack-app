"use client";
import { useState, useEffect } from "react";

export default function BreathingExercise({ onComplete }) {
  const [phase, setPhase] = useState("Breathe In...");
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds total
  const [active, setActive] = useState(false);

  // Box breathing: 4s inhale, 4s hold, 4s exhale, 4s hold
  useEffect(() => {
    if (!active) return;
    
    let interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setActive(false);
          setTimeout(onComplete, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [active, onComplete]);

  useEffect(() => {
    if (!active) {
      if (timeLeft === 0) setPhase("Done.");
      return;
    }

    // 16-second cycle
    const cycleTime = 16;
    const current = (60 - timeLeft) % cycleTime;

    if (current < 4) setPhase("Breathe In...");
    else if (current < 8) setPhase("Hold...");
    else if (current < 12) setPhase("Breathe Out...");
    else setPhase("Hold...");

  }, [timeLeft, active]);

  if (!active && timeLeft === 60) {
    return (
      <div className="breathing-container fade-up">
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌬️</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>High Stress Detected</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 32, fontSize: 14 }}>
          Before we continue with your reflection, let&apos;s take 60 seconds to regulate your nervous system with a Box Breathing exercise.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-secondary" onClick={onComplete}>Skip</button>
          <button className="btn btn-primary" style={{ minWidth: 160, justifyContent: "center" }} onClick={() => setActive(true)}>
            Start Breathing
          </button>
        </div>
      </div>
    );
  }

  // Animation states
  const scale = phase === "Breathe In..." ? 1.5 : phase === "Breathe Out..." ? 1 : phase === "Hold..." ? (timeLeft % 16 < 8 ? 1.5 : 1) : 1;
  const opacity = phase === "Hold..." ? 0.7 : 1;

  return (
    <div className="breathing-container fade-up" style={{ textAlign: "center", padding: "60px 0" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}</h2>
      <p style={{ color: "var(--text-dim)", marginBottom: 60, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {timeLeft > 0 ? "Follow the circle" : "Great job"}
      </p>

      <div style={{ 
        height: 200, display: "flex", alignItems: "center", justifyContent: "center" 
      }}>
        {timeLeft > 0 ? (
          <div 
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)",
              border: "1px solid rgba(255,255,255,0.3)",
              boxShadow: "0 0 40px rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 4s linear, opacity 1s ease",
              transform: `scale(${scale})`,
              opacity: opacity,
            }}
          >
            <span style={{ 
              fontWeight: 700, 
              color: "var(--bg)", 
              fontSize: 14, 
              transition: "opacity 0.3s",
              opacity: phase.includes("Hold") ? 0.5 : 1
            }}>
              {phase}
            </span>
          </div>
        ) : (
          <div className="fade-up" style={{ fontSize: 64 }}>✨</div>
        )}
      </div>

    </div>
  );
}
