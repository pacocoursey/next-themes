import './globals.css'
import { ThemeProvider } from '../components/ThemeProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white dark:bg-black min-h-[100dvh]">
        <ThemeProvider
          defaultTheme="light"
          enableColorScheme
          themes={['light', 'dark-classic', 'tangerine', 'dark-tangerine', 'mint', 'dark-mint']}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
