import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "next-themes + Cache Components",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <nav style={styles.nav}>
          <span style={styles.title}>next-themes + Cache Components</span>
          <Link href="/en">English</Link>
          <Link href="/es">Español</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}

const styles = {
  nav: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
    borderBottom: "1px solid var(--border)",
    padding: "1rem 1.5rem",
  },
  title: {
    fontWeight: 600,
  },
} satisfies Record<string, React.CSSProperties>;
