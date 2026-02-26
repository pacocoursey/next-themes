import { ThemeToggle } from "./theme-toggle";
import { EventLog } from "./event-log";

const content: Record<string, { title: string; description: string }> = {
  en: {
    title: "Hello",
    description: "Toggle the theme, switch locale, and see what happens.",
  },
  es: {
    title: "Hola",
    description: "Cambia el tema, cambia de idioma, y mira lo que pasa.",
  },
};

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { title, description } = content[locale] ?? content.en;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>{title}</h1>
        <p style={{ marginTop: "0.5rem", color: "var(--muted)" }}>
          {description}
        </p>
      </div>

      <ThemeToggle />

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>How it works</h2>
        <ol style={styles.list}>
          <li>
            Each locale (<code>/en</code>, <code>/es</code>) is a separate
            route.
          </li>
          <li>
            With <code>cacheComponents</code> enabled, navigating between
            locales keeps both routes mounted in the DOM.
          </li>
          <li>
            <code>next-themes</code> uses <code>useSyncExternalStore</code>{" "}
            backed by <code>localStorage</code> so the theme stays consistent
            across all mounted routes.
          </li>
          <li>
            Toggle the theme, switch locale, and check the event log below.
          </li>
        </ol>
      </div>

      <EventLog />
    </div>
  );
}

const styles = {
  card: {
    border: "1px solid var(--border)",
    borderRadius: "0.5rem",
    padding: "1rem",
  },
  cardTitle: {
    marginBottom: "0.5rem",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "var(--muted)",
  },
  list: {
    paddingLeft: "1.25rem",
    fontSize: "0.875rem",
    color: "var(--muted)",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.25rem",
  },
} satisfies Record<string, React.CSSProperties>;
