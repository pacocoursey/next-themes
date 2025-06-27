'use client'

import * as React from 'react'
import { script } from './script'
import type { Attribute, ThemeProviderProps, UseThemeProps } from './types'

const colorSchemes = ['light', 'dark']
const MEDIA = '(prefers-color-scheme: dark)'
const isServer = typeof window === 'undefined'
const ThemeContext = React.createContext<UseThemeProps | undefined>(undefined)
const defaultContext: UseThemeProps = { setTheme: _ => { }, themes: [] }

const saveToLS = (storageKey: string, value: string) => {
  // Save to storage
  try {
    localStorage.setItem(storageKey, value)
  } catch (e) {
    // Unsupported
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
  themeRoot
}: ThemeProviderProps) => {
  const [theme, setThemeState] = React.useState(() => getTheme(storageKey, defaultTheme))
  const [resolvedTheme, setResolvedTheme] = React.useState(() => theme === 'system' ? getSystemTheme() : theme)
  const attrs = !value ? themes : Object.values(value)
  
  const applyTheme = React.useCallback(theme => {
    let resolved = theme
    if (!resolved) return
    
    // If theme is system, resolve it before setting theme
    if (theme === 'system' && enableSystem) {
      resolved = getSystemTheme()
    }
    
    const name = value ? value[resolved] : resolved
    const enable = disableTransitionOnChange ? disableAnimation(nonce, themeRoot?.shadowRoot ?? document.head) : null
    const d = themeRoot ?? document.documentElement

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

    if (Array.isArray(attribute)) attribute.forEach(handleAttribute)
    else handleAttribute(attribute)

    if (enableColorScheme) {
      const fallback = colorSchemes.includes(defaultTheme) ? defaultTheme : null
      const colorScheme = colorSchemes.includes(resolved) ? resolved : fallback
      // @ts-ignore
      d.style.colorScheme = colorScheme
    }

    enable?.()
  }, [nonce, themeRoot])

  const setTheme = React.useCallback(value => {
    if (typeof value === 'function') {
      setThemeState(prevTheme => {
        const newTheme = value(prevTheme)

        saveToLS(storageKey, newTheme)

        return newTheme
      })
    } else {
      setThemeState(value)
      saveToLS(storageKey, value)
    }
  }, [])

  const handleMediaQuery = React.useCallback(
    (e: MediaQueryListEvent | MediaQueryList) => {
      const resolved = getSystemTheme(e)
      setResolvedTheme(resolved)

      if (theme === 'system' && enableSystem && !forcedTheme) {
        applyTheme('system')
      }
    },
    [theme, forcedTheme]
  )

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

  // Whenever theme or forcedTheme changes, apply it
  React.useEffect(() => {
    applyTheme(forcedTheme ?? theme)
  }, [forcedTheme, theme])

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
          scriptProps,
          themeRoot
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
    const scriptArgs = JSON.stringify([
      attribute,
      storageKey,
      defaultTheme,
      forcedTheme,
      themes,
      value,
      enableSystem,
      enableColorScheme
    ]).slice(1, -1)

    return (
      <script
        {...scriptProps}
        suppressHydrationWarning
        nonce={typeof window === 'undefined' ? nonce : ''}
        dangerouslySetInnerHTML={{ __html: `(${script.toString()})(${scriptArgs})` }}
      />
    )
  }
)

// Helpers
const getTheme = (key: string, fallback?: string) => {
  if (isServer) return undefined
  let theme
  try {
    theme = localStorage.getItem(key) || undefined
  } catch (e) {
    // Unsupported
  }
  return theme || fallback
}

const disableAnimation = (nonce?: string, target: Element | ShadowRoot = document.head) => {
  const css = document.createElement('style')
  if (nonce) css.setAttribute('nonce', nonce)
  css.appendChild(
    document.createTextNode(
      `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`
    )
  )
  target.appendChild(css)

  return () => {
    // Force restyle
    ; (() => window.getComputedStyle(document.body))()

    // Wait for next tick before removing
    setTimeout(() => {
      target.removeChild(css)
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
