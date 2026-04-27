import axios from "axios";

// In production (Firebase), set NEXT_PUBLIC_API_URL to your backend URL.
// In local dev, Next.js rewrites /api/* → http://127.0.0.1:8000/api/*
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
const API = axios.create({ baseURL: BASE_URL });

// ── Session ────────────────────────────────────────────────────────────────
export const getSessionInfo = (sessionId) =>
  API.get(`/report/session?session_id=${sessionId}`);

// ── Check-in ───────────────────────────────────────────────────────────────
export const submitCheckin = (data) => API.post("/checkin", data);

export const getTodayStatus = (sessionId) =>
  API.get(`/checkin/today?session_id=${sessionId}`);

export const getAllCheckins = (sessionId, limit = 30) =>
  API.get(`/checkin/all?session_id=${sessionId}&limit=${limit}`);

export const searchMemory = (sessionId, query, limit = 20) =>
  API.get("/memory/search", {
    params: { session_id: sessionId, q: query, limit },
  });

// ── Dashboard ──────────────────────────────────────────────────────────────
export const getDashboard = (sessionId) =>
  API.get(`/dashboard?session_id=${sessionId}`);

// ── Report ─────────────────────────────────────────────────────────────────
export const downloadPDF = async (sessionId) => {
  const res = await API.get(`/report/pdf?session_id=${sessionId}`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = `mindtrack_report_${sessionId.slice(0, 8)}.pdf`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const downloadCSV = async (sessionId) => {
  const res = await API.get(`/report/csv?session_id=${sessionId}`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `mindtrack_data_${sessionId.slice(0, 8)}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};
