"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { getAllCheckins, searchMemory } from "../../lib/api";
import { SparklesCore } from "../../components/ui/sparkles";

const scoreColor = (score) => {
  if (score >= 4) return "var(--ok)";
  if (score >= 3) return "var(--warn)";
  if (score >= 2) return "#fb923c";
  return "var(--danger)";
};

const formatScore = (score) => {
  const value = Number(score);
  return Number.isFinite(value) ? `${value.toFixed(1)}/5` : "N/A";
};

const formatDate = (dateStr) => {
  if (!dateStr) return "Unknown date";
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function HistoryPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [searchLabel, setSearchLabel] = useState("All reflections");
  const [error, setError] = useState(null);

  useEffect(() => {
    const sid = localStorage.getItem("mindtrack_session");
    if (!sid) {
      router.push("/");
      return;
    }
    setSessionId(sid);

    getAllCheckins(sid, 365)
      .then((res) => setHistory(res.data || []))
      .catch((err) => {
        console.error("Failed to load history:", err);
        setError("Failed to load your reflection history.");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!sessionId) return;

    setSearching(true);
    setError(null);
    try {
      if (!query.trim()) {
        const res = await getAllCheckins(sessionId, 365);
        setHistory(res.data || []);
        setSearchLabel("All reflections");
      } else {
        const res = await searchMemory(sessionId, query.trim(), 30);
        setHistory(res.data.results || []);
        setSearchLabel(`${res.data.total_matches} match${res.data.total_matches === 1 ? "" : "es"} for "${query.trim()}"`);
      }
    } catch (err) {
      console.error("Failed to search history:", err);
      setError("Failed to search your reflections.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", position: "relative" }}>
      {/* Sparkles background */}
      <div style={{
        position: "fixed", inset: 0,
        zIndex: 0, pointerEvents: "none",
        opacity: 0.3,
      }}>
        <SparklesCore
          id="history-sparkles"
          background="transparent"
          minSize={0.3}
          maxSize={1.0}
          particleDensity={40}
          particleColor="#ffffff"
          speed={0.6}
        />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
      <Navbar />

      <main className="page">
        <div className="container" style={{ maxWidth: 920 }}>
          <header style={{ marginBottom: 40 }} className="fade-up">
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 6 }}>
              Reflection History
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: 15 }}>
              A complete log of your check-ins and AI-driven insights.
            </p>
          </header>

          {!loading && (
            <form className="card fade-up" style={{ marginBottom: 24, padding: 20 }} onSubmit={handleSearch}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Second Brain Search</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 14 }}>
                Ask things like &quot;show days I felt anxious&quot; or &quot;when was I most productive?&quot;
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search emotions, keywords, stress, or productivity..."
                  style={{
                    flex: "1 1 320px",
                    background: "var(--bg-3)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "12px 14px",
                    fontSize: 14,
                  }}
                />
                <button className="btn btn-primary" disabled={searching} type="submit">
                  {searching ? "Searching..." : "Search Memory"}
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSearchLabel("All reflections");
                    if (sessionId) {
                      setSearching(true);
                      getAllCheckins(sessionId, 365)
                        .then((res) => setHistory(res.data || []))
                        .finally(() => setSearching(false));
                    }
                  }}
                >
                  Clear
                </button>
              </div>
              <div style={{ marginTop: 12, color: "var(--text-dim)", fontSize: 12 }}>
                {searchLabel}
              </div>
            </form>
          )}

          {loading && (
            <div className="loader-page">
              <div className="loader" />
              <span>Loading your history...</span>
            </div>
          )}

          {!loading && error && (
            <div className="alert alert-danger">{error}</div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="card fade-up" style={{ textAlign: "center", padding: "48px 24px" }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>No history found</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
                You haven&apos;t completed any daily check-ins yet.
              </p>
              <button
                onClick={() => router.push("/checkin")}
                className="btn btn-primary"
                style={{ justifyContent: "center" }}
              >
                Start Check-in
              </button>
            </div>
          )}

          {!loading && !error && history.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {history.map((entry) => {
                const score = Number(entry.composite_score);
                const category = entry.cbt_category?.replace("_", " ");

                return (
                  <article
                    key={entry.id ?? entry.checkin_date}
                    className="card card-hover"
                    style={{ padding: 24 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 16,
                        flexWrap: "wrap",
                        marginBottom: 18,
                      }}
                    >
                      <div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                          {formatDate(entry.checkin_date)}
                        </h2>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span className="badge badge-dark">
                            {entry.dominant_emotion || "neutral"}
                          </span>
                          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                            Score:{" "}
                            <strong style={{ color: scoreColor(score) }}>
                              {formatScore(entry.composite_score)}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(4, minmax(64px, 1fr))",
                          gap: 12,
                          minWidth: 280,
                        }}
                      >
                        {[
                          ["Emotion", entry.emotional_state],
                          ["Stress", entry.stress_level],
                          ["Load", entry.cognitive_load],
                          ["Drive", entry.motivation_level],
                        ].map(([label, value]) => (
                          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ color: "var(--text-dim)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                              {label}
                            </span>
                            <span style={{ fontWeight: 700 }}>{value}/5</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {entry.text_response && (
                      <div style={{ marginBottom: 18 }}>
                        <h3 className="form-label" style={{ marginBottom: 8 }}>Your Reflection</h3>
                        <p
                          style={{
                            color: "var(--text-muted)",
                            lineHeight: 1.7,
                            background: "var(--bg-3)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-sm)",
                            padding: "12px 14px",
                            fontStyle: "italic",
                          }}
                        >
                          &ldquo;{entry.text_response}&rdquo;
                        </p>
                      </div>
                    )}

                    {entry.cbt_response && (
                      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                          <h3 className="form-label" style={{ marginBottom: 0 }}>AI CBT Insight</h3>
                          {category && <span className="badge badge-dark">{category}</span>}
                        </div>
                        <p style={{ color: "var(--text-muted)", lineHeight: 1.75, fontSize: 14, whiteSpace: "pre-wrap" }}>
                          {entry.cbt_response}
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
      </div>
    </div>
  );
}
