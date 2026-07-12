'use client'

import * as React from 'react'
import { script } from './script'
import type { Attribute, ThemeProviderProps, UseThemeProps } from './types'

const colorSchemes = ['light', 'dark']
const MEDIA = '(prefers-color-scheme: dark)'
const isServer = typeof window === 'undefined'
const ThemeContext = React.createContext<UseThemeProps | undefined>(undefined)
const defaultContext: UseThemeProps = { setTheme: _ => { }, themes: [] }

const saveToLS = (storageKey: string, value: string, onStorageError?: (error: unknown) => void) => {
  try {
    localStorage.setItem(storageKey, value)
  } catch (e) {
    onStorageError?.(e)
  }
}

export const useTheme = () => React.useContext(ThemeContext) ?? defaultContext

export const ThemeProvider = (props: ThemeProviderProps) => {
  const context = React.useContext(ThemeContext)

  // Ignore nested context providers, just passthrough children
  if (context) return <>{props.children}</>
  return <Theme {...props} />
}

const defaultThemes = ['light', 'dark']

const Theme = ({
  forcedTheme,
  disableTransitionOnChange = false,
  enableSystem = true,
  enableColorScheme = true,
  storageKey = 'theme',
  themes = defaultThemes,
  defaultTheme = enableSystem ? 'system' : 'light',
  attribute = 'data-theme',
  value,
  children,
  nonce,
  scriptProps,
  onStorageError
}: ThemeProviderProps) => {
  const [theme, setThemeState] = React.useState(() => getTheme(storageKey, defaultTheme, onStorageError))
  const [resolvedTheme, setResolvedTheme] = React.useState(() => theme === 'system' ? getSystemTheme() : theme)

  const propsRef = React.useRef({
    attribute,
    value,
    enableSystem,
    enableColorScheme,
    defaultTheme,
    disableTransitionOnChange,
    nonce,
    onStorageError
  })

  const themeRef = React.useRef({ theme, forcedTheme })

  const propsVersionRef = React.useRef(0)

  const applyTheme = React.useCallback(theme => {
    let resolved = theme
    if (!resolved) return

    const {
      attribute: attr,
      value: val,
      enableSystem: enableSys,
      enableColorScheme: enableCS,
      defaultTheme: defTheme,
      disableTransitionOnChange: disableTrans,
      nonce: n
    } = propsRef.current

    if (theme === 'system' && enableSys) {
      resolved = getSystemTheme()
    }

    const attrs = !val ? themes : Object.values(val)
    const name = val ? val[resolved] : resolved
    const enable = disableTrans ? disableAnimation(n) : null
    const d = document.documentElement

    const handleAttribute = (attr: Attribute) => {
      if (attr === 'class') {
        d.classList.remove(...attrs)
        if (name) d.classList.add(name)
      } else if (attr.startsWith('data-')) {
        if (name) {
          d.setAttribute(attr, name)
        } else {
          d.removeAttribute(attr)
        }
      }
    }

    if (Array.isArray(attr)) attr.forEach(handleAttribute)
    else handleAttribute(attr)

    if (enableCS) {
      const fallback = colorSchemes.includes(defTheme) ? defTheme : null
      const colorScheme = colorSchemes.includes(resolved) ? resolved : fallback
      // @ts-ignore
      d.style.colorScheme = colorScheme
    } else {
      // @ts-ignore
      d.style.colorScheme = ''
    }

    enable?.()
  }, [])

  const setTheme = React.useCallback(value => {
    if (typeof value === 'function') {
      setThemeState(prevTheme => {
        const newTheme = value(prevTheme)
        saveToLS(storageKey, newTheme, propsRef.current.onStorageError)
        return newTheme
      })
    } else {
      setThemeState(value)
      saveToLS(storageKey, value, propsRef.current.onStorageError)
    }
  }, [])

  const mediaQueryInitialized = React.useRef(false)

  const handleMediaQuery = React.useCallback(
    (e: MediaQueryListEvent | MediaQueryList) => {
      const resolved = getSystemTheme(e)
      setResolvedTheme(resolved)

      // Skip applyTheme on the initial synchronous call — the [forcedTheme, theme]
      // effect already handles the initial mount. Only apply on actual change events.
      if (!mediaQueryInitialized.current) {
        mediaQueryInitialized.current = true
        return
      }

      if (themeRef.current.theme === 'system' && propsRef.current.enableSystem && !themeRef.current.forcedTheme) {
        applyTheme('system')
      }
    },
    [theme, forcedTheme, applyTheme]
  )

  // Sync refs on every render so callbacks always read current values
  React.useEffect(() => {
    propsRef.current = {
      attribute,
      value,
      enableSystem,
      enableColorScheme,
      defaultTheme,
      disableTransitionOnChange,
      nonce,
      onStorageError
    }
  })

  React.useEffect(() => {
    themeRef.current = { theme, forcedTheme }
  })

  // Always listen to System preference
  React.useEffect(() => {
    const media = window.matchMedia(MEDIA)

    // Intentionally use deprecated listener methods to support iOS & old browsers
    media.addListener(handleMediaQuery)
    handleMediaQuery(media)

    return () => media.removeListener(handleMediaQuery)
  }, [handleMediaQuery])

  // localStorage event handling
  React.useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) {
        return
      }

      // If default theme set, use it if localstorage === null (happens on local storage manual deletion)
      if (!e.newValue) {
        setTheme(defaultTheme)
      } else {
        setThemeState(e.newValue) // Direct state update to avoid loops
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [setTheme])

  // Whenever theme, forcedTheme, or props change, re-apply to the DOM.
  // propsVersionRef increments every render so prop-only changes trigger re-application.
  // applyTheme reads from propsRef.current, so it always gets the latest values.
  React.useEffect(() => {
    propsVersionRef.current++
    applyTheme(forcedTheme ?? theme)
  }, [forcedTheme, theme, propsVersionRef.current])

  const providerValue = React.useMemo(
    () => ({
      theme,
      setTheme,
      forcedTheme,
      resolvedTheme: theme === 'system' ? resolvedTheme : theme,
      themes: enableSystem ? [...themes, 'system'] : themes,
      systemTheme: (enableSystem ? resolvedTheme : undefined) as 'light' | 'dark' | undefined
    }),
    [theme, setTheme, forcedTheme, resolvedTheme, enableSystem, themes]
  )

  return (
    <ThemeContext.Provider value={providerValue}>
      <ThemeScript
        {...{
          forcedTheme,
          storageKey,
          attribute,
          enableSystem,
          enableColorScheme,
          defaultTheme,
          value,
          themes,
          nonce,
          scriptProps
        }}
      />

      {children}
    </ThemeContext.Provider>
  )
}

export const ThemeScript = React.memo(
  ({
    forcedTheme,
    storageKey,
    attribute,
    enableSystem,
    enableColorScheme,
    defaultTheme,
    value,
    themes,
    nonce,
    scriptProps
  }: Omit<ThemeProviderProps, 'children'> & { defaultTheme: string }) => {
    const escapedScript = JSON.stringify([
      attribute,
      storageKey,
      defaultTheme,
      forcedTheme,
      themes,
      value,
      enableSystem,
      enableColorScheme
    ])
      .slice(1, -1)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/\//g, '\\u002f')

    return (
      <script
        {...scriptProps}
        suppressHydrationWarning
        nonce={typeof window === 'undefined' ? nonce : ''}
        dangerouslySetInnerHTML={{ __html: `(${script.toString()})(${escapedScript})` }}
      />
    )
  }
)

// Helpers
const getTheme = (key: string, fallback?: string, onStorageError?: (error: unknown) => void) => {
  if (isServer) return undefined
  let theme
  try {
    theme = localStorage.getItem(key) || undefined
  } catch (e) {
    onStorageError?.(e)
  }
  return theme || fallback
}

const disableAnimation = (nonce?: string) => {
  const css = document.createElement('style')
  if (nonce) css.setAttribute('nonce', nonce)
  css.appendChild(
    document.createTextNode(
      `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`
    )
  )
  document.head.appendChild(css)

  return () => {
    // Force restyle
    ; (() => window.getComputedStyle(document.body))()

    // Wait for next tick before removing
    setTimeout(() => {
      document.head.removeChild(css)
    }, 1)
  }
}

const getSystemTheme = (e?: MediaQueryList | MediaQueryListEvent) => {
  if (!e) e = window.matchMedia(MEDIA)
  const isDark = e.matches
  const systemTheme = isDark ? 'dark' : 'light'
  return systemTheme
}

// Re-export types
export type { Attribute, ThemeProviderProps, UseThemeProps } from './types'
