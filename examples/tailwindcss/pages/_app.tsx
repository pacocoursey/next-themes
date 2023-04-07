import React from 'react'
import { ThemeProvider } from 'next-themes'
import '../styles.css'
import { AppProps } from 'next/app'
import { NextComponentType, NextPageContext } from 'next'

type MyAppProps<P = {}> = AppProps<P> & {
  Component: {
    theme?: 'light' | 'dark'
  } & NextComponentType<NextPageContext, any, {}>
}

function MyApp({ Component, pageProps }: MyAppProps) {
  return (
    <ThemeProvider forcedTheme={Component.theme || undefined} attribute="class">
      <Component {...pageProps} />
    </ThemeProvider>
  )
}

export default MyApp
