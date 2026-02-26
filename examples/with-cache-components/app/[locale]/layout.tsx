import { ThemeProvider } from "next-themes";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "es" }];
}

const labels: Record<string, string> = {
  en: "English",
  es: "Español",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <ThemeProvider>
      <div style={styles.container}>
        <p style={styles.badge}>
          Locale: <strong>{labels[locale] ?? locale}</strong>
        </p>
        {children}
      </div>
    </ThemeProvider>
  );
}

const styles = {
  container: {
    maxWidth: "36rem",
    margin: "0 auto",
    padding: "2rem 1.5rem",
  },
  badge: {
    marginBottom: "1.5rem",
    background: "var(--surface)",
    padding: "0.5rem 0.75rem",
    borderRadius: "0.375rem",
    fontFamily: "monospace",
    fontSize: "0.75rem",
  },
} satisfies Record<string, React.CSSProperties>;
