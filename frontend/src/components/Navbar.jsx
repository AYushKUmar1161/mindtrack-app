"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar({ streak = 0 }) {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = [
    { href: "/", label: "Home" },
    { href: "/checkin", label: "Check-in" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/history", label: "History" },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "0 24px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: scrolled
          ? "rgba(8,8,8,0.92)"
          : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "none",
        transition: "all 0.3s ease",
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            width: 32, height: 32,
            background: "var(--text)",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px",
          }}
        >
          🧠
        </span>
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>
          MindTrack
        </span>
      </Link>

      {/* Nav Links */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="btn btn-ghost"
            style={{
              color: path === l.href ? "var(--text)" : "var(--text-muted)",
              background: path === l.href ? "var(--bg-3)" : "transparent",
            }}
          >
            {l.label}
          </Link>
        ))}
      </div>

      {/* Streak badge */}
      {streak > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            background: "var(--bg-3)",
            border: "1px solid var(--border-2)",
            borderRadius: "99px",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          <span>🔥</span>
          <span>{streak} day streak</span>
        </div>
      )}
    </nav>
  );
}
