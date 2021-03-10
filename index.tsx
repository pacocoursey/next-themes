import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  memo
} from 'react'
import NextHead from 'next/head'

interface UseThemeProps {
  themes: string[]
  setTheme: (theme: string) => void
  theme?: string
  forcedTheme?: string
  resolvedTheme?: string
  systemTheme?: 'dark' | 'light'
}

const ThemeContext = createContext<UseThemeProps>({
  setTheme: (_) => {},
  themes: []
})
export const useTheme = () => useContext(ThemeContext)

interface ValueObject {
  [themeName: string]: string
}

export interface ThemeProviderProps {
  forcedTheme?: string
  disableTransitionOnChange?: boolean
  enableSystem?: boolean
  enableColorScheme?: boolean
  storageKey?: string
  themes?: string[]
  colorSchemes?: string[]
  defaultTheme?: string
  attribute?: string
  value?: ValueObject
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  forcedTheme,
  disableTransitionOnChange = false,
  enableSystem = true,
  enableColorScheme = true,
  storageKey = 'theme',
  themes = ['light', 'dark'],
  colorSchemes = themes,
  defaultTheme = enableSystem ? 'system' : 'light',
  attribute = 'data-theme',
  value,
  children
}) => {
  const [theme, setThemeState] = useState(() =>
    getTheme(storageKey, defaultTheme)
  )
  const [resolvedTheme, setResolvedTheme] = useState(() => getTheme(storageKey))
  const attrs = !value ? themes : Object.values(value)

  const changeTheme = useCallback(
    (theme, updateStorage = true, updateDOM = true) => {
      const name = value?.[theme] || theme

      const enable =
        disableTransitionOnChange && updateDOM ? disableAnimation() : null

      if (updateStorage) {
        try {
          localStorage.setItem(storageKey, theme)
        } catch (e) {
          // Unsupported
        }
      }

      if (updateDOM) {
        const d = document.documentElement

        if (attribute === 'class') {
          d.classList.remove(...attrs)
          d.classList.add(name)
        } else {
          d.setAttribute(attribute, name)
        }
        enable?.()
      }
    },
    []
  )

  const handleMediaQuery = useCallback(
    (e) => {
      const isDark = e.matches
      const systemTheme = isDark ? colorSchemes[1] || 'dark' : colorSchemes[0] || 'light'
      setResolvedTheme(systemTheme)

      if (theme === 'system' && !forcedTheme) changeTheme(systemTheme)
    },
    [theme, forcedTheme]
  )

  useEffect(() => {
    if (!enableSystem) {
      return
    }

    // Always listen to System preference
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addListener(handleMediaQuery)
    handleMediaQuery(media)

    return () => media.removeListener(handleMediaQuery)
  }, [handleMediaQuery])

  const setTheme = useCallback(
    (newTheme) => {
      if (forcedTheme) {
        changeTheme(newTheme, true, false)
      } else {
        changeTheme(newTheme)
      }
      setThemeState(newTheme)
    },
    [forcedTheme]
  )

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) {
        return
      }

      const theme = e.newValue
      setTheme(theme)
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [setTheme])

  useEffect(() => {
    if (!enableColorScheme) return

    let colorScheme =
      // If theme is forced to light or dark, use that
      forcedTheme && colorSchemes.includes(forcedTheme)
        ? forcedTheme
        : // If regular theme is light or dark
        theme && colorSchemes.includes(theme)
        ? theme
        : // If theme is system, use the resolved version
        theme === 'system'
        ? resolvedTheme || null
        : null

    // color-scheme tells browser how to render built-in elements like forms, scrollbars, etc.
    // if color-scheme is null, this will remove the property
    document.documentElement.style.setProperty('color-scheme', colorScheme)
  }, [enableColorScheme, theme, resolvedTheme, forcedTheme])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        forcedTheme,
        resolvedTheme: theme === 'system' ? resolvedTheme : theme,
        themes: enableSystem ? [...themes, 'system'] : themes,
        systemTheme: (enableSystem ? resolvedTheme : undefined) as
          | 'light'
          | 'dark'
          | undefined
      }}
    >
      <ThemeScript
        {...{
          forcedTheme,
          storageKey,
          attribute,
          value,
          enableSystem,
          defaultTheme,
          attrs
        }}
      />
      {children}
    </ThemeContext.Provider>
  )
}

const ThemeScript = memo(
  ({
    forcedTheme,
    storageKey,
    attribute,
    enableSystem,
    defaultTheme,
    value,
    attrs
  }: {
    forcedTheme?: string
    storageKey: string
    attribute?: string
    enableSystem?: boolean
    defaultTheme: string
    value?: ValueObject
    attrs: any
  }) => {
    // Code-golfing the amount of characters in the script
    const optimization = (() => {
      if (attribute === 'class') {
        const removeClasses = `d.remove(${attrs
          .map((t: string) => `'${t}'`)
          .join(',')})`

        return `var d=document.documentElement.classList;${removeClasses};`
      } else {
        return `var d=document.documentElement;`
      }
    })()

    const updateDOM = (name: string, literal?: boolean) => {
      name = value?.[name] || name
      const val = literal ? name : `'${name}'`

      if (attribute === 'class') {
        return `d.add(${val})`
      }

      return `d.setAttribute('${attribute}', ${val})`
    }

    const defaultSystem = defaultTheme === 'system'

    return (
      <NextHead>
        {forcedTheme ? (
          <script
            key="next-themes-script"
            dangerouslySetInnerHTML={{
              // These are minified via Terser and then updated by hand, don't recommend
              // prettier-ignore
              __html: `!function(){${optimization}${updateDOM(forcedTheme)}}()`
            }}
          />
        ) : enableSystem ? (
          <script
            key="next-themes-script"
            dangerouslySetInnerHTML={{
              // prettier-ignore
              __html: `!function(){try {${optimization}var e=localStorage.getItem('${storageKey}');${!defaultSystem ? updateDOM(defaultTheme) + ';' : ''}if("system"===e||(!e&&${defaultSystem})){var t="(prefers-color-scheme: dark)",m=window.matchMedia(t);m.media!==t||m.matches?${updateDOM(attrs[1] || 'dark')}:${updateDOM(attrs[0] || 'light')}}else if(e) ${value ? `var x=${JSON.stringify(value)};` : ''}${updateDOM(value ? 'x[e]' : 'e', true)}}catch(e){}}()`
            }}
          />
        ) : (
          <script
            key="next-themes-script"
            dangerouslySetInnerHTML={{
              // prettier-ignore
              __html: `!function(){try{${optimization}var e=localStorage.getItem("${storageKey}");if(e){${value ? `var x=${JSON.stringify(value)};` : ''}${updateDOM(value ? 'x[e]' : 'e', true)}}else{${updateDOM(defaultTheme)};}}catch(t){}}();`
            }}
          />
        )}
      </NextHead>
    )
  },
  (prevProps, nextProps) => {
    // Only re-render when forcedTheme changes
    // the rest of the props should be completely stable
    if (prevProps.forcedTheme !== nextProps.forcedTheme) return false
    return true
  }
)

// Helpers
const getTheme = (key: string, fallback?: string) => {
  if (typeof window === 'undefined') return undefined
  let theme
  try {
    theme = localStorage.getItem(key) || undefined
  } catch (e) {
    // Unsupported
  }
  return theme || fallback
}

const disableAnimation = () => {
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
