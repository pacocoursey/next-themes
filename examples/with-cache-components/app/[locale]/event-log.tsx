"use client";

import { useEffect, useRef, useState } from "react";

export function EventLog() {
  const [entries, setEntries] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;

    function log(msg: string) {
      const time = new Date().toLocaleTimeString("en", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setEntries((prev) => [...prev.slice(-19), `${time} ${msg}`]);
    }

    log(`initial data-theme="${html.getAttribute("data-theme")}"`);

    const observer = new MutationObserver(() => {
      log(`data-theme changed to "${html.getAttribute("data-theme")}"`);
    });

    observer.observe(html, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [entries]);

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "0.5rem" }}>
      <div style={styles.header}>
        Event log (watching data-theme attribute)
      </div>
      <div ref={scrollRef} style={styles.log}>
        {entries.length === 0 ? (
          <p style={{ color: "var(--muted)", opacity: 0.5 }}>
            No events yet...
          </p>
        ) : (
          entries.map((entry, i) => <div key={i}>{entry}</div>)
        )}
      </div>
    </div>
  );
}

const styles = {
  header: {
    borderBottom: "1px solid var(--border)",
    padding: "0.5rem 0.75rem",
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "var(--muted)",
  },
  log: {
    height: "10rem",
    overflowY: "auto" as const,
    padding: "0.75rem",
    fontFamily: "monospace",
    fontSize: "0.75rem",
    color: "var(--muted)",
  },
} satisfies Record<string, React.CSSProperties>;
