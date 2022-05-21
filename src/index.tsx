import * as React from 'react'
import type { UseThemeProps, ThemeProviderProps, ValueObject } from './types'

const MEDIA = '(prefers-color-scheme: dark)'
const isServer = typeof window === 'undefined'
const ThemeContext = React.createContext<UseThemeProps | undefined>(undefined)
const defaultContext: UseThemeProps = { setTheme: _ => {}, themes: [] }

export const useTheme = () => React.useContext(ThemeContext) ?? defaultContext

export const ThemeProvider: React.FC<ThemeProviderProps> = props => {
  const context = React.useContext(ThemeContext)

  // Ignore nested context providers, just passthrough children
  if (context) return <React.Fragment>{props.children}</React.Fragment>
  return <Theme {...props} />
}

const Theme: React.FC<ThemeProviderProps> = ({
  forcedTheme,
  disableTransitionOnChange = false,
  enableSystem = true,
  enableColorScheme = true,
  storageKey = 'theme',
  themes = ['light', 'dark'],
  defaultTheme = enableSystem ? 'system' : 'light',
  attribute = 'data-theme',
  value,
  themeColor,
  children,
  nonce
}) => {
  const [themeState, setThemeState] = React.useState(() => getTheme(storageKey, defaultTheme))
  const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark'>()
  const themeColorEl = React.useRef<HTMLMetaElement>()
  const rootStyles = React.useRef<CSSStyleDeclaration>()
  const scriptCache = React.useRef<string>()

  const theme = forcedTheme ? 'forced' : themeState
  const resolvedTheme = forcedTheme ?? themeState === 'system' ? systemTheme : themeState
  const attr = resolvedTheme && value ? value[resolvedTheme] : resolvedTheme

  const resolveCSSColor = (color: string) => {
    // Resolve CSS variable value
    if (color.startsWith('var(--')) {
      // Cache if not already
      if (!rootStyles.current) {
        rootStyles.current = getComputedStyle(document.documentElement)
      }

      return rootStyles.current
        .getPropertyValue(
          // var(--bg) → --bg
          color.slice(4, -1)
        )
        .trim()
    }

    // Regular CSS color string
    return color
  }

  const handleThemeColor = () => {
    if (!attr || !themeColor) return

    let shouldInsert = false

    const value = (() => {
      if (typeof themeColor === 'string') {
        return resolveCSSColor(themeColor)
      }

      // Object value
      return resolveCSSColor(themeColor[attr])
    })()

    const el = (() => {
      // Had the element cached
      if (themeColorEl.current?.isConnected) {
        return themeColorEl.current
      }

      // Meta tag already exists in the dom
      const found = document.head.querySelector('meta[name="theme-color"]') as HTMLMetaElement
      if (found) return found

      // Does not exist, create one
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'theme-color')
      shouldInsert = true
      return meta
    })()

    // Cache element
    themeColorEl.current = el

    // CSS variable could be undefined
    if (value) {
      // Update the DOM
      el.removeAttribute('value') // standardize on the content attribute instead of value
      el.setAttribute('content', value)

      if (shouldInsert) {
        document.head.appendChild(el)
      }
    }
  }

  const setTheme = React.useCallback(
    theme => {
      setThemeState(theme)

      if (!forcedTheme) {
        try {
          localStorage.setItem(storageKey, theme)
        } catch (e) {}
      }
    },
    [forcedTheme]
  )

  // When the theme is switched, update the DOM accordingly
  React.useEffect(() => {
    const enable = disableTransitionOnChange ? disableTransition() : null

    // Update the DOM
    if (forcedTheme) ff(forcedTheme)
    else if (enableSystem) sf(defaultTheme, storageKey)
    else rf(defaultTheme, storageKey)

    if (themeColor) handleThemeColor()

    enable?.()
  }, [resolvedTheme, forcedTheme, theme])

  // localStorage event handling
  React.useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) return
      // When storage is null (after manual deletion), use default theme
      const theme = e.newValue || defaultTheme
      setTheme(theme)
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [forcedTheme])

  // Listen to system preference if enableSystem
  React.useEffect(() => {
    if (!enableSystem) return

    function handle(e: MediaQueryList | MediaQueryListEvent) {
      setSystemTheme(getSystemTheme(e))
    }

    // Intentionally use deprecated listener methods to support iOS & old browsers
    const media = window.matchMedia(MEDIA)
    media.addListener(handle)
    handle(media)
    return () => media.removeListener(handle)
  }, [theme])

  /** Forced function */
  const ff = (t: string) => {
    // @ts-ignore
    window.__ntu(t)
  }

  /** System function */
  const sf = (fallback: string, key: string) => {
    try {
      var stored = localStorage.getItem(key)

      if (stored === 'system') {
        // @ts-ignore
        window.__ntu(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      } else {
        // @ts-ignore
        window.__ntu(stored || fallback)
      }
    } catch (_) {}
  }

  /** Regular function */
  const rf = (fallback: string, key: string) => {
    try {
      var stored = localStorage.getItem(key)
      // @ts-ignore
      window.__ntu(stored || fallback)
    } catch (_) {}
  }

  const script = (() => {
    if (typeof window === 'undefined') {
      /** Update DOM */
      const ud = (d: HTMLElement, v: ValueObject, a: string, c: string) => {
        return (t: string) => {
          var r = v[t] || t
          if (a === 'class') d.classList.add(r)
          else d.setAttribute(a, r)
          const colorScheme = r === 'light' || r === 'dark' ? r : ''
          // @ts-ignore
          if (c) d.style.colorScheme = colorScheme
        }
      }

      const fn = forcedTheme ? ff : enableSystem ? sf : rf
      const args = forcedTheme ? [forcedTheme] : [defaultTheme, storageKey]

      const a = `var __ntu=(${ud.toString()})(document.documentElement,${JSON.stringify(
        value ?? {}
      )},'${attribute}',${enableColorScheme})`
      const b = `(${fn.toString()})(${args.map(a => `'${a}'`).join(',')})`

      return `${a};${b}`
    }

    if (!scriptCache.current) {
      scriptCache.current = document.getElementById('next-themes-script')?.innerHTML || ''
    }

    return scriptCache.current
  })()

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        systemTheme,
        resolvedTheme,
        themes: enableSystem ? [...themes, 'system'] : themes
      }}
    >
      <script id="next-themes-script" nonce={nonce} dangerouslySetInnerHTML={{ __html: script }} />
      {children}
    </ThemeContext.Provider>
  )
}

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

const disableTransition = () => {
  const css = document.createElement('style')
  css.appendChild(
    document.createTextNode(
      `*{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`
    )
  )
  document.head.appendChild(css)

  return () => {
    // Force restyle
    ;(() => window.getComputedStyle(document.body))()

    // Wait for next tick before removing
    setTimeout(() => {
      document.head.removeChild(css)
    }, 1)
  }
}

const getSystemTheme = (e?: MediaQueryList | MediaQueryListEvent) => {
  if (!e) e = window.matchMedia(MEDIA)
  return e.matches ? 'dark' : 'light'
}
