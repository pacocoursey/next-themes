import { ThemeProvider } from 'next-themes'
import '../styles.css'

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider forcedTheme={Component.theme || undefined} themeColor="var(--bg)" enableSystem={false}>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}

export default MyApp
