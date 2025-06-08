import { ThemeProvider, ContrastProvider } from 'next-themes'
import '../styles.css'

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider forcedTheme={Component.theme || undefined}>
      <ContrastProvider forcedContrast={Component.contrast || undefined}>
        <Component {...pageProps} />
      </ContrastProvider>
    </ThemeProvider>
  )
}

export default MyApp
