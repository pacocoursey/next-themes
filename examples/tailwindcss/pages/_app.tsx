import React from 'react'
import { ThemeProvider } from 'next-themes'
import '../styles.css'
import { AppProps } from 'next/app'

type MyAppProps = AppProps & {
  Component: {
    theme?: 'light' | 'dark'
  }
}

function MyApp({ Component, pageProps }: MyAppProps) {
  return (
    <ThemeProvider forcedTheme={Component.theme || undefined} attribute="class">
      <Component {...pageProps} />
    </ThemeProvider>
  )
}

export default MyApp
