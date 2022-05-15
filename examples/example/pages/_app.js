import { ThemeProvider } from 'next-themes'
import '../styles.css'

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider forcedTheme={Component.theme || undefined} themeColor="var(--bg)">
      <Component {...pageProps} />
    </ThemeProvider>
  )
}

export default MyApp
