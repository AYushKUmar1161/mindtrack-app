"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart,
  PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import Navbar from "../../components/Navbar";
import { getDashboard, downloadPDF, downloadCSV } from "../../lib/api";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { subDays } from "date-fns";
import { SparklesCore } from "../../components/ui/sparkles";
// ── Custom Chart Tooltip ────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-2)", border: "1px solid var(--border-2)",
      borderRadius: 8, padding: "10px 14px", fontSize: 12,
    }}>
      <p style={{ fontWeight: 600, marginBottom: 6, color: "var(--text)" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed(2) : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Trend Badge ─────────────────────────────────────────────────────────────
function TrendBadge({ direction }) {
  const map = {
    improving: { label: "↑ Improving", cls: "badge-ok" },
    declining: { label: "↓ Declining", cls: "badge-danger" },
    stable:    { label: "→ Stable",    cls: "badge-warn" },
  };
  const t = map[direction] || map.stable;
  return <span className={`badge ${t.cls}`}>{t.label}</span>;
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function Stat({ label, value, sub, highlight }) {
  return (
    <div className="stat-card" style={{ borderColor: highlight ? "var(--border-2)" : undefined }}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value ?? "—"}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

// ── Insight Panel ────────────────────────────────────────────────────────────
function InsightPanel({ insight, trend }) {
  if (!insight) return null;
  const segments = insight.split(" | ").filter(Boolean);
  return (
    <div className="card" style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em" }}>AI Insights</h3>
        {trend?.trend_direction && <TrendBadge direction={trend.trend_direction} />}
      </div>
      <div>
        {segments.map((s, i) => (
          <span key={i} className="insight-segment">{s}</span>
        ))}
      </div>

      {/* Alerts */}
      {trend?.mood_swing_detected && (
        <div className="alert alert-warn" style={{ marginTop: 14 }}>
          🌊 <strong>Mood swings detected.</strong> Your emotions have been fluctuating significantly.
        </div>
      )}
      {trend?.stress_spike_detected && (
        <div className="alert alert-danger" style={{ marginTop: 8 }}>
          ⚡ <strong>Stress spike detected.</strong> Your stress has been elevated in recent days.
        </div>
      )}
    </div>
  );
}

function IntelligencePanel({ personalization, forecast, wellness, explainability, interventions }) {
  const riskClass = forecast?.risk_level === "high"
    ? "badge-danger"
    : forecast?.risk_level === "moderate"
      ? "badge-warn"
      : "badge-ok";

  return (
    <div className="grid-2 fade-up-2" style={{ marginBottom: 24 }}>
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700 }}>Wellness Score</h3>
          <span className="badge badge-dark">{wellness?.label || "No data"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 44, fontWeight: 800, fontFamily: "JetBrains Mono, monospace" }}>
            {wellness?.score != null ? wellness.score : "—"}
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>/100</span>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>
          {wellness?.summary || "Complete check-ins to calculate a wellness score."}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          <span className="badge badge-dark">
            Weekly {wellness?.weekly_improvement_pct != null ? `${wellness.weekly_improvement_pct}%` : "pending"}
          </span>
          <span className="badge badge-dark">
            Stability {wellness?.stability_index != null ? `${wellness.stability_index}%` : "pending"}
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700 }}>Mood Forecast</h3>
          <span className={`badge ${riskClass}`}>{forecast?.risk_level || "unknown"}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 14 }}>
          <div className="stat-card" style={{ padding: 14 }}>
            <span className="stat-label">Next Mood</span>
            <span className="stat-value" style={{ fontSize: 24 }}>
              {forecast?.next_mood_score ?? "—"}
            </span>
          </div>
          <div className="stat-card" style={{ padding: 14 }}>
            <span className="stat-label">Next Stress</span>
            <span className="stat-value" style={{ fontSize: 24 }}>
              {forecast?.next_stress_level ?? "—"}
            </span>
          </div>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.7 }}>
          {forecast?.message || "Add at least 3 check-ins to unlock forecasting."}
        </p>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Personalization Engine</h3>
        <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>
          {personalization?.adaptation_note || "MindTrack will adapt once it sees more history."}
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {(personalization?.frequent_emotions || []).map((item) => (
            <span key={item.emotion} className="badge badge-dark">
              {item.emotion} x {item.count}
            </span>
          ))}
          {!(personalization?.frequent_emotions || []).length && (
            <span className="badge badge-dark">learning</span>
          )}
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
          Stress: {personalization?.stress_pattern?.direction || "unknown"} - Recent avg: {personalization?.stress_pattern?.recent_average ?? "—"}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
          {(personalization?.time_of_day_mood || []).map((item) => (
            <span key={item.period} className="badge badge-dark">
              {item.period}: {item.average_score}/5
            </span>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Explainable AI</h3>
        {explainability ? (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <span className="badge badge-dark">Emotion: {explainability.emotion}</span>
              <span className="badge badge-dark">Sentiment: {explainability.sentiment ?? "—"}</span>
              <span className="badge badge-dark">Response: {explainability.response_category || "—"}</span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.7, marginBottom: 10 }}>
              {explainability.reason}
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {(explainability.keywords || []).slice(0, 6).map((keyword) => (
                <span key={keyword} className="badge badge-dark">{keyword}</span>
              ))}
            </div>
            {(explainability.triggers || []).slice(0, 3).map((trigger) => (
              <div key={trigger} className="insight-segment">{trigger}</div>
            ))}
          </>
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            Complete a check-in to see why the AI chose a response.
          </p>
        )}
      </div>

      <div className="card" style={{ padding: 24, gridColumn: "1 / -1" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Smart Interventions</h3>
        {interventions?.length ? (
          <div className="grid-3">
            {interventions.map((item) => (
              <div key={item.type} className="stat-card" style={{ padding: 16 }}>
                <span className={`badge ${item.priority === "high" ? "badge-danger" : "badge-dark"}`} style={{ alignSelf: "flex-start" }}>
                  {item.priority}
                </span>
                <strong style={{ fontSize: 14 }}>{item.title}</strong>
                <span style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6 }}>
                  {item.message}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            No intervention needed from the latest check-in.
          </p>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [sessionId, setSessionId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadingCSV, setDownloadingCSV] = useState(false);
  const [error, setError] = useState(null);

  const loadDashboard = async (sid) => {
    if (!sid) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getDashboard(sid);
      setData(response.data);
    } catch {
      setData(null);
      setError("Failed to load dashboard data. Make sure the backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let sid = localStorage.getItem("mindtrack_session");
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem("mindtrack_session", sid);
    }
    setSessionId(sid);
    loadDashboard(sid);
  }, []);

  const handlePDF = async () => {
    setDownloading(true);
    try {
      await downloadPDF(sessionId);
    } catch (e) {
      alert(e?.response?.data?.detail || "Failed to generate report.");
    } finally {
      setDownloading(false);
    }
  };

  const handleCSV = async () => {
    setDownloadingCSV(true);
    try {
      await downloadCSV(sessionId);
    } catch (e) {
      alert(e?.response?.data?.detail || "Failed to export CSV.");
    } finally {
      setDownloadingCSV(false);
    }
  };

  if (loading) {
    return (
      <div className="loader-page">
        <div className="loader" />
        <span>Loading your emotional dashboard…</span>
      </div>
    );
  }

  const checkins = data?.checkins || [];
  const trend    = data?.trend;
  const streak   = data?.streak_days || 0;
  const total    = data?.total_checkins || 0;
  const personalization = data?.personalization;
  const forecast = data?.forecast;
  const wellness = data?.wellness;
  const explainability = data?.explainability;
  const interventions = data?.interventions || [];

  // Format dates in chart data
  const chartData = checkins.map((c) => ({
    ...c,
    date: c.date?.slice(5),  // MM-DD
    sentiment_pct: c.vader_compound !== null
      ? Number(((c.vader_compound + 1) / 2 * 100).toFixed(1))
      : null,
  }));

  // Radar data — latest check-in
  const latest = checkins[checkins.length - 1];
  const radarData = latest
    ? [
        { axis: "Mood",       value: latest.emotional_state  },
        { axis: "Motivation", value: latest.motivation_level  },
        { axis: "Calmness",   value: 6 - latest.stress_level  },
        { axis: "Focus",      value: 6 - latest.cognitive_load },
        { axis: "Sentiment",  value: latest.vader_compound !== null
            ? Number(((latest.vader_compound + 1) / 2 * 5).toFixed(1))
            : 3,
        },
      ]
    : [];

  const hasData = checkins.length > 0;

  const CHART_COLORS = {
    emotional_state:  "#ffffff",
    stress_level:     "#888888",
    motivation_level: "#aaaaaa",
    cognitive_load:   "#555555",
    sentiment_pct:    "#dddddd",
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
          id="dashboard-sparkles"
          background="transparent"
          minSize={0.3}
          maxSize={1.0}
          particleDensity={40}
          particleColor="#ffffff"
          speed={0.6}
        />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
      <Navbar streak={streak} />
      <div className="page">
        <div className="container">

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
            <div className="fade-up">
              <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>
                Your Emotional Dashboard
              </h1>
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
                Short-term emotional profile · {total} day{total !== 1 ? "s" : ""} tracked
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }} className="fade-up-1">
              <Link href="/checkin" className="btn btn-primary btn-sm">+ Check-in</Link>
              {hasData && (
                <>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleCSV}
                    disabled={downloadingCSV}
                  >
                    {downloadingCSV ? "Exporting…" : "⬇ CSV Data"}
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handlePDF}
                    disabled={downloading}
                  >
                    {downloading ? "Generating…" : "⬇ PDF Report"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* No data state */}
          {error && !hasData && (
            <div className="card fade-up" style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>!</div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Dashboard unavailable</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 15 }}>
                {error}
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={() => loadDashboard(sessionId)}>
                  Retry
                </button>
                <Link href="/checkin" className="btn btn-secondary">
                  Go to Check-in
                </Link>
              </div>
            </div>
          )}

          {!error && !hasData && (
            <div style={{ textAlign: "center", padding: "80px 24px" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🌱</div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>No data yet</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 15 }}>
                Complete your first daily check-in to start tracking your emotional trends.
              </p>
              <Link href="/checkin" className="btn btn-primary btn-lg">
                Begin your first check-in →
              </Link>
            </div>
          )}

          {hasData && (
            <>
              {/* ── Mood Calendar Heatmap ── */}
              <div className="card fade-up-1" style={{ padding: "24px", marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>
                  Mood Consistency
                </h3>
                <div style={{ padding: "0 10px" }}>
                  <CalendarHeatmap
                    startDate={subDays(new Date(), 120)} // Show ~4 months
                    endDate={new Date()}
                    values={checkins.map(c => ({
                      date: c.date,
                      count: c.composite_score || c.emotional_state
                    }))}
                    classForValue={(value) => {
                      if (!value) return "color-empty";
                      if (value.count >= 4) return "color-scale-4";
                      if (value.count >= 3) return "color-scale-3";
                      if (value.count >= 2) return "color-scale-2";
                      return "color-scale-1";
                    }}
                    showWeekdayLabels={true}
                    tooltipDataAttrs={(value) => {
                      return {
                        "data-tip": value.date ? `${value.date}: Mood Score ${Number(value.count).toFixed(1)}/5` : "No check-in"
                      };
                    }}
                  />
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid-4 fade-up-1" style={{ marginBottom: 24 }}>
                <Stat
                  label="🔥 Streak"
                  value={streak}
                  sub="consecutive days"
                  highlight={streak >= 7}
                />
                <Stat
                  label="📊 Days Tracked"
                  value={total}
                  sub={`of 15 day window`}
                />
                <Stat
                  label="😊 Avg Mood"
                  value={trend?.avg_emotional_state ? Number(trend.avg_emotional_state).toFixed(1) : "—"}
                  sub="out of 5"
                />
                <Stat
                  label="⚡ Avg Stress"
                  value={trend?.avg_stress ? Number(trend.avg_stress).toFixed(1) : "—"}
                  sub="out of 5"
                />
              </div>

              <IntelligencePanel
                personalization={personalization}
                forecast={forecast}
                wellness={wellness}
                explainability={explainability}
                interventions={interventions}
              />

              {/* ── Insight Panel ── */}
              {trend?.insight_message && (
                <div className="fade-up-2" style={{ marginBottom: 24 }}>
                  <InsightPanel insight={trend.insight_message} trend={trend} />
                </div>
              )}

              {/* ── Main Charts ── */}
              <div className="chart-grid">


                {/* Area chart: Emotional State + Stress */}
                <div className="card fade-up-2" style={{ padding: "24px" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>
                    Emotional Trends Over Time
                  </h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={chartData} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradMood" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#ffffff" stopOpacity={0.12} />
                          <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradStress" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#888888" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#888888" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fill: "var(--text-dim)", fontSize: 11 }} />
                      <YAxis domain={[1, 5]} tick={{ fill: "var(--text-dim)", fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }} />
                      <Area type="monotone" dataKey="emotional_state" name="Mood" stroke="#ffffff" fill="url(#gradMood)" strokeWidth={2} dot={{ r: 3, fill: "#fff" }} />
                      <Area type="monotone" dataKey="stress_level"   name="Stress" stroke="#888888" fill="url(#gradStress)" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3, fill: "#888" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Radar chart: Latest day profile */}
                <div className="card fade-up-3" style={{ padding: "24px" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>
                    Today&apos;s Profile
                  </h3>
                  {radarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart cx="50%" cy="50%" outerRadius="55%" data={radarData}>
                        <PolarGrid stroke="var(--border)" />
                        <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                        <Radar name="Profile" dataKey="value" stroke="#ffffff" fill="#ffffff" fillOpacity={0.08} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ textAlign: "center", color: "var(--text-dim)", fontSize: 13, padding: "40px 0" }}>
                      Check in today to see your profile
                    </div>
                  )}
                </div>
              </div>

              {/* ── Motivation + Cognitive Load ── */}
              <div className="card fade-up-3" style={{ padding: "24px", marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>
                  Motivation & Cognitive Load
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fill: "var(--text-dim)", fontSize: 11 }} />
                    <YAxis domain={[1, 5]} tick={{ fill: "var(--text-dim)", fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }} />
                    <Line type="monotone" dataKey="motivation_level" name="Motivation" stroke="#aaaaaa" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="cognitive_load"   name="Cognitive Load" stroke="#555555" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* ── Sentiment Chart ── */}
              <div className="card fade-up-4" style={{ padding: "24px", marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                  Sentiment Score Over Time
                </h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
                  Derived from NLP analysis of daily text responses. 100% = very positive, 0% = very negative.
                </p>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={chartData.filter(c => c.sentiment_pct !== null)} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradSent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#dddddd" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#dddddd" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fill: "var(--text-dim)", fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "var(--text-dim)", fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="sentiment_pct" name="Sentiment %" stroke="#dddddd" fill="url(#gradSent)" strokeWidth={2} dot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* ── Variability & Secondary Stats ── */}
              <div className="grid-3 fade-up" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                  <span className="stat-label">🌊 Variability Score</span>
                  <span className="stat-value">
                    {trend?.variability_score != null ? `${(trend.variability_score * 100).toFixed(0)}%` : "—"}
                  </span>
                  <span className="stat-sub">
                    {trend?.variability_score != null
                      ? trend.variability_score > 0.5 ? "High fluctuation" : trend.variability_score > 0.25 ? "Moderate" : "Stable"
                      : "Tracking..."}
                  </span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">💬 Avg Sentiment</span>
                  <span className="stat-value">
                    {trend?.avg_sentiment != null
                      ? `${(((trend.avg_sentiment + 1) / 2) * 100).toFixed(0)}%`
                      : "—"}
                  </span>
                  <span className="stat-sub">NLP compound score</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">🎯 Avg Motivation</span>
                  <span className="stat-value">
                    {trend?.avg_motivation ? Number(trend.avg_motivation).toFixed(1) : "—"}
                  </span>
                  <span className="stat-sub">out of 5</span>
                </div>
              </div>

              {/* ── Recent Check-in History ── */}
              <div className="card fade-up" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700 }}>Recent Check-ins</h3>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                        {["Date", "Mood", "Stress", "Motivation", "Cognition", "Sentiment", "Emotion", "Category"].map((h) => (
                          <th key={h} style={{ padding: "10px 16px", fontWeight: 600, fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...checkins].reverse().map((c, i) => (
                        <tr
                          key={c.date}
                          style={{
                            borderBottom: "1px solid var(--border)",
                            background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                          }}
                        >
                          <td style={{ padding: "10px 16px", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>{c.date}</td>
                          <td style={{ padding: "10px 16px", fontWeight: 700 }}>{c.emotional_state}/5</td>
                          <td style={{ padding: "10px 16px", color: c.stress_level >= 4 ? "var(--danger)" : "var(--text-muted)" }}>{c.stress_level}/5</td>
                          <td style={{ padding: "10px 16px" }}>{c.motivation_level}/5</td>
                          <td style={{ padding: "10px 16px" }}>{c.cognitive_load}/5</td>
                          <td style={{ padding: "10px 16px", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                            {c.vader_compound != null ? Number(c.vader_compound).toFixed(2) : "—"}
                          </td>
                          <td style={{ padding: "10px 16px" }}>
                            {c.dominant_emotion && (
                              <span className="badge badge-dark">{c.dominant_emotion}</span>
                            )}
                          </td>
                          <td style={{ padding: "10px 16px" }}>
                            {c.cbt_category && (
                              <span className={`badge ${
                                c.cbt_category === "crisis_alert" ? "badge-danger" :
                                c.cbt_category === "grounding" ? "badge-warn" :
                                c.cbt_category === "reinforcement" ? "badge-ok" :
                                "badge-dark"
                              }`}>{c.cbt_category}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="alert alert-info" style={{ marginTop: 24 }}>
                ⚠️ <strong>Disclaimer:</strong> MindTrack is not a medical tool and does not provide clinical diagnosis or treatment.
                If you are experiencing severe distress, please contact a licensed mental health professional.
                Crisis support: <strong>India iCall: 9152987821</strong> · <strong>US: 988</strong>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
