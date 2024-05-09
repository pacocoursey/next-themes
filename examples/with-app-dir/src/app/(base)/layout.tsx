import '../globals.css'
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white dark:bg-black min-h-dvh">
        {/* The `storage` prop is not set on the ThemeProvider below, so `storage` defaults to "localStorage" */}
        <ThemeProvider attribute="class">{children}</ThemeProvider>
      </body>
    </html>
  )
}
