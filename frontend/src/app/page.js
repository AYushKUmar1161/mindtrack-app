"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { SparklesCore } from "../components/ui/sparkles";

const FEATURES = [
  { icon: "📊", title: "5 Daily Questions", desc: "Quick micro-interactions tracking mood, stress, cognition, motivation, and open reflection." },
  { icon: "🧠", title: "NLP Emotion Analysis", desc: "Sentiment analysis with VADER & TextBlob — extracting polarity, intensity, and emotion keywords." },
  { icon: "📈", title: "Short-Term Pattern Detection", desc: "Track emotional trends over 10–15 days. Detect mood swings, stress spikes, and variability." },
  { icon: "💬", title: "Adaptive CBT Responses", desc: "Evidence-based grounding, activation, and coping exercises tailored to your emotional state." },
  { icon: "🔥", title: "Streak System", desc: "Daily check-in streaks keep you consistent. Consistency is where change begins." },
  { icon: "📄", title: "PDF Report Export", desc: "Download your full emotional profile report with trends, stats, and AI insights." },
];

const STATS = [
  { value: "5", label: "Daily questions" },
  { value: "15", label: "Day window" },
  { value: "4", label: "CBT categories" },
  { value: "100%", label: "Private" },
];

export default function HomePage() {
  const heroRef = useRef(null);

  useEffect(() => {
    // Subtle parallax on hero
    const handler = (e) => {
      if (!heroRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 10;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      heroRef.current.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 32px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
        background: "rgba(8,8,8,0.9)", backdropFilter: "blur(16px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>🧠</span>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em" }}>MindTrack</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/dashboard" className="btn btn-ghost" style={{ fontSize: 13 }}>Dashboard</Link>
          <Link href="/checkin" className="btn btn-primary btn-sm">Start Check-in →</Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "120px 24px 80px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* ── Sparkles background ── */}
        <div style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          zIndex: 0, pointerEvents: "none",
        }}>
          <SparklesCore
            id="hero-sparkles"
            background="transparent"
            minSize={0.4}
            maxSize={1.4}
            particleDensity={80}
            particleColor="#ffffff"
            speed={1.2}
            className="hero-sparkles-canvas"
          />
        </div>

        {/* Background grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          opacity: 0.25,
          mask: "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)",
          zIndex: 1, pointerEvents: "none",
        }} />

        {/* Glow orb */}
        <div ref={heroRef} style={{
          position: "absolute",
          width: 400, height: 400,
          background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
          borderRadius: "50%",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          transition: "transform 0.1s ease",
          pointerEvents: "none",
          zIndex: 2,
        }} />

        <div style={{ position: "relative", maxWidth: 760, zIndex: 3 }} className="fade-up">
          <div className="badge badge-dark mb-4" style={{ margin: "0 auto 20px" }}>
            Short-term Emotional Assessment · CBT-driven
          </div>

          <h1 style={{
            fontSize: "clamp(40px, 8vw, 72px)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            marginBottom: 24,
            background: "linear-gradient(180deg, #ffffff 60%, #666666 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Understand your mind<br />in 15 days
          </h1>

          <p style={{
            fontSize: "clamp(16px, 2.5vw, 20px)",
            color: "var(--text-muted)",
            maxWidth: 560,
            margin: "0 auto 40px",
            lineHeight: 1.7,
          }}>
            5 daily questions. AI-powered NLP analysis. CBT-based adaptive responses.
            Early emotional pattern detection — no long-term commitment needed.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/checkin" className="btn btn-primary btn-lg">
              Begin Daily Check-in
            </Link>
            <Link href="/dashboard" className="btn btn-secondary btn-lg">
              View Dashboard
            </Link>
          </div>

          {/* Disclaimer */}
          <p style={{ marginTop: 24, fontSize: 12, color: "var(--text-dim)" }}>
            ⚠️ Not a medical tool. For educational purposes only. Seek professional help for clinical concerns.
          </p>
        </div>

        {/* Stats row */}
        <div style={{
          position: "relative",
          display: "flex", gap: 40, marginTop: 80,
          flexWrap: "wrap", justifyContent: "center",
          zIndex: 3,
        }} className="fade-up-2">
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "JetBrains Mono, monospace" }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12 }}>
            Built for early detection
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
            Grounded in research on short-term emotional modeling and cognitive behavioral therapy.
          </p>
        </div>

        <div className="grid-3" style={{ gap: 16 }}>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="card card-hover"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, letterSpacing: "-0.01em" }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section style={{
        padding: "80px 24px",
        background: "var(--bg-2)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 48 }}>
            How it works
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              ["01", "Daily 5-question check-in", "Answer questions on mood, stress, cognition, and motivation. Write your thoughts freely."],
              ["02", "NLP processes your responses", "Sentiment analysis, keyword extraction, and emotion classification run instantly."],
              ["03", "Trends are detected & weighted", "Recent days carry more weight. Mood swings and stress spikes are flagged automatically."],
              ["04", "Receive your CBT response", "A personalised, evidence-based response with exercises and affirmations is generated."],
            ].map(([num, title, desc], i) => (
              <div key={num} style={{
                display: "flex", gap: 24, padding: "24px 0",
                borderBottom: i < 3 ? "1px solid var(--border)" : "none",
                textAlign: "left",
                alignItems: "flex-start",
              }}>
                <span style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 13, fontWeight: 600,
                  color: "var(--text-dim)",
                  minWidth: 32, paddingTop: 2,
                }}>{num}</span>
                <div>
                  <strong style={{ display: "block", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{title}</strong>
                  <span style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7 }}>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section style={{ padding: "100px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 }}>
          Your mind deserves attention
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: 16, marginBottom: 36 }}>
          5 minutes a day. 15 days. Meaningful insights.
        </p>
        <Link href="/checkin" className="btn btn-primary btn-lg">
          Start your first check-in →
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        padding: "24px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
        fontSize: 13,
        color: "var(--text-dim)",
      }}>
        <span>🧠 MindTrack — Not a medical tool</span>
        <span>⚠️ Seek professional help if you are in distress · iCall: 9152987821 · US: 988</span>
      </footer>
    </div>
  );
}
