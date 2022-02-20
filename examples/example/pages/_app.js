import { ThemeProvider } from 'next-themes'
import '../styles.css'

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider forcedTheme={Component.theme || undefined}>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}

export default MyApp
