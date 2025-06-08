'use client'

import * as React from 'react'
import { scriptTheme, scriptContrast } from './script'
import type {
  Attribute,
  Contrast,
  ContrastProviderProps,
  ThemeProviderProps,
  UseContrastProps,
  UseThemeProps
} from './types'

const colorSchemes = ['light', 'dark']
const COLOR_SCHEME_MEDIA = '(prefers-color-scheme: dark)'
const CONTRAST_LESS_MEDIA = '(prefers-contrast: less)'
const CONTRAST_MORE_MEDIA = '(prefers-contrast: more)'
const isServer = typeof window === 'undefined'

const ThemeContext = React.createContext<UseThemeProps | undefined>(undefined)
const defaultThemeContext: UseThemeProps = { setTheme: _ => { }, themes: [] }

const ContrastContext = React.createContext<UseContrastProps | undefined>(undefined)
const defaultContrastContext: UseContrastProps = { setContrast: _ => { } }

const saveToLS = (storageKey: string, value: string) => {
  // Save to storage
  try {
    localStorage.setItem(storageKey, value)
  } catch (e) {
    // Unsupported
  }
}

export const useTheme = () => React.useContext(ThemeContext) ?? defaultThemeContext
export const useContrast = () => React.useContext(ContrastContext) ?? defaultContrastContext

export const ThemeProvider = (props: ThemeProviderProps) => {
  const context = React.useContext(ThemeContext)

  // Ignore nested context providers, just passthrough children
  if (context) return <>{props.children}</>
  return <Theme {...props} />
}

export const ContrastProvider = (props: ContrastProviderProps) => {
  const context = React.useContext(ContrastContext)

  // Ignore nested context providers, just passthrough children
  if (context) return <>{props.children}</>
  return <ContrastProviderInternal {...props} />
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
  scriptProps
}: ThemeProviderProps) => {
  const [theme, setThemeState] = React.useState(() => getFromLocalStorage(storageKey, defaultTheme))
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
    const enable = disableTransitionOnChange ? disableAnimation(nonce) : null
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

    if (Array.isArray(attribute)) attribute.forEach(handleAttribute)
    else handleAttribute(attribute)

    if (enableColorScheme) {
      const fallback = colorSchemes.includes(defaultTheme) ? defaultTheme : null
      d.style.colorScheme = colorSchemes.includes(resolved) ? resolved : fallback
    }

    enable?.()
  }, [nonce])

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
    const media = window.matchMedia(COLOR_SCHEME_MEDIA)

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
          scriptProps
        }}
      />

      {children}
    </ThemeContext.Provider>
  )
}

const ContrastProviderInternal = ({
  forcedContrast,
  disableTransitionOnChange = false,
  storageKey = 'contrast',
  defaultContrast = 'no-preference',
  attribute = 'data-contrast',
  value,
  children,
  nonce,
  scriptProps
}: ContrastProviderProps) => {
  const [contrast, setContrastState] = React.useState<Contrast>(() => getFromLocalStorage(storageKey, defaultContrast))
  const attrs = !value ? [] : Object.values(value)

  const applyContrast = React.useCallback(contrast => {
    if (!contrast) return

    const name = value ? value[contrast] : contrast
    const enable = disableTransitionOnChange ? disableAnimation(nonce) : null

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

    if (Array.isArray(attribute)) attribute.forEach(handleAttribute)
    else handleAttribute(attribute)

    enable?.()
  }, [nonce])

  const setContrast = React.useCallback(value => {
    if (typeof value === 'function') {
      setContrastState(prevContrast => {
        const newContrast = value(prevContrast)

        saveToLS(storageKey, newContrast)

        return newContrast
      })
    } else {
      setContrastState(value)
      saveToLS(storageKey, value)
    }
  }, [])

  const handleContrastMediaQuery = React.useCallback(
    (e: MediaQueryListEvent | MediaQueryList) => {
      const resolved = getSystemContrast(e)
      setContrastState(resolved)

      if (!forcedContrast) {
        applyContrast(resolved)
      }
    },
    [forcedContrast]
  )

  // Always listen to System preference
  React.useEffect(() => {
    const contrastMoreMedia = window.matchMedia(CONTRAST_MORE_MEDIA)
    const contrastLessMedia = window.matchMedia(CONTRAST_LESS_MEDIA)

    // Intentionally use deprecated listener methods to support iOS & old browsers
    contrastMoreMedia.addListener(handleContrastMediaQuery)
    contrastLessMedia.addListener(handleContrastMediaQuery)
    handleContrastMediaQuery(contrastMoreMedia)
    handleContrastMediaQuery(contrastLessMedia)

    return () => {
      contrastMoreMedia.removeListener(handleContrastMediaQuery)
      contrastLessMedia.removeListener(handleContrastMediaQuery)
    }
  }, [handleContrastMediaQuery])

  // localStorage event handling
  React.useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) {
        return
      }

      // If default contrast set, use it if localstorage === null (happens on local storage manual deletion)
      if (!e.newValue) {
        setContrast(defaultContrast)
      } else {
        setContrastState(e.newValue as Contrast) // Direct state update to avoid loops
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [setContrast])

  // Whenever theme or forcedContrast changes, apply it
  React.useEffect(() => {
    applyContrast(forcedContrast ?? contrast)
  }, [forcedContrast, contrast])

  const providerValue = React.useMemo(
    () => ({
      contrast,
      setContrast,
      forcedContrast,
    }),
    [contrast, setContrast, forcedContrast]
  )

  return (
    <ContrastContext.Provider value={providerValue}>
      <ContrastScript
        {...{
          forcedContrast,
          storageKey,
          attribute,
          defaultContrast,
          value,
          nonce,
          scriptProps
        }}
      />

      {children}
    </ContrastContext.Provider>
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
        dangerouslySetInnerHTML={{ __html: `(${scriptTheme.toString()})(${scriptArgs})` }}
      />
    )
  }
)

export const ContrastScript = React.memo(
  ({
    forcedContrast,
    storageKey,
    attribute,
    defaultContrast,
    value,
    nonce,
    scriptProps
  }: Omit<ContrastProviderProps, 'children'>) => {
    const scriptArgs = JSON.stringify([
      attribute,
      storageKey,
      defaultContrast,
      forcedContrast,
      value,
    ]).slice(1, -1)

    return (
      <script
        {...scriptProps}
        suppressHydrationWarning
        nonce={typeof window === 'undefined' ? nonce : ''}
        dangerouslySetInnerHTML={{ __html: `(${scriptContrast.toString()})(${scriptArgs})` }}
      />
    )
  }
)

// Helpers
const getFromLocalStorage = (key: string, fallback?: string) => {
  if (isServer) return undefined
  let theme
  try {
    theme = localStorage.getItem(key) || undefined
  } catch (e) {
    // Unsupported
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
  if (!e) e = window.matchMedia(COLOR_SCHEME_MEDIA)
  const isDark = e.matches

  return isDark ? 'dark' : 'light'
}

const getSystemContrast = (e?: MediaQueryList | MediaQueryListEvent): Contrast => {
  if (!e) e = window.matchMedia(CONTRAST_MORE_MEDIA)
  if (e.matches) return 'more'

  e = window.matchMedia(CONTRAST_LESS_MEDIA)
  if (e.matches) return 'less'

  return 'no-preference'
}

// Re-export types
export type { Attribute, Contrast, ThemeProviderProps, UseThemeProps, UseContrastProps } from './types'
