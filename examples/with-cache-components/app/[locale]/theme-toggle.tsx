"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
        Current theme:
      </span>
      <button
        onClick={() =>
          setTheme(resolvedTheme === "dark" ? "light" : "dark")
        }
        style={{
          borderRadius: "9999px",
          border: "1px solid var(--border)",
          padding: "0.375rem 1rem",
          fontSize: "0.875rem",
          fontWeight: 500,
          background: "transparent",
          color: "inherit",
          cursor: "pointer",
        }}
      >
        {resolvedTheme === "dark" ? "Dark" : "Light"} — click to toggle
      </button>
    </div>
  );
}
