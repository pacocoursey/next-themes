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
  theme: undefined,
  forcedTheme: undefined,
  resolvedTheme: undefined,
  themes: [],
  systemTheme: undefined
})
export const useTheme = () => useContext(ThemeContext)

interface ValueObject {
  [themeName: string]: string
}

export interface ThemeProviderProps {
  forcedTheme?: string
  disableTransitionOnChange?: boolean
  enableSystem?: boolean
  storageKey?: string
  themes?: string[]
  defaultTheme?: string
  attribute?: string
  value?: ValueObject
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  forcedTheme,
  disableTransitionOnChange = false,
  enableSystem = true,
  storageKey = 'theme',
  themes = ['light', 'dark'],
  defaultTheme = 'light',
  attribute = 'data-theme',
  value,
  children
}) => {
  const [theme, setThemeState] = useState(() => getTheme(storageKey))
  const [resolvedTheme, setResolvedTheme] = useState(() => getTheme(storageKey))

  const changeTheme = useCallback((theme, updateStorage = true) => {
    const attributeValues = !value ? themes : Object.values(value)
    const name = value?.[theme] || theme

    const enable = disableTransitionOnChange ? disableAnimation() : null

    if (updateStorage) {
      localStorage.setItem(storageKey, theme)
    }

    if (attribute === 'class') {
      document.documentElement.classList.remove(...attributeValues)
      document.documentElement.classList.add(name)
    } else {
      document.documentElement.setAttribute(attribute, name)
    }
    enable?.()
    // All of these deps are stable and should never change
  }, []) // eslint-disable-line

  const handleMediaQuery = useCallback(
    (e) => {
      const isDark = e.matches
      const systemTheme = isDark ? 'dark' : 'light'
      setResolvedTheme(systemTheme)

      if (theme === 'system') changeTheme(systemTheme, false)
    },
    [theme] // eslint-disable-line
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
  }, [handleMediaQuery]) // eslint-disable-line

  const setTheme = useCallback(
    (newTheme) => {
      if (forcedTheme) {
        return
      }

      changeTheme(newTheme)
      setThemeState(newTheme)
    },
    // All of these deps are stable and should never change
    [] // eslint-disable-line
  )

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== 'theme') {
        return
      }

      const theme = e.newValue
      setTheme(theme)
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
    // All of these deps are stable and should never change
  }, []) // eslint-disable-line

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
          themes
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
    themes
  }: {
    forcedTheme?: string
    storageKey: string
    attribute?: string
    enableSystem?: boolean
    defaultTheme: string
    value?: ValueObject
    themes: string[]
  }) => {
    const updateDOM = (name: string, literal?: boolean) => {
      const attributeValues = !value ? themes : Object.values(value)
      if (value) {
        name = value[name] || name
      }
      const val = literal ? name : `'${name}'`
      if (attribute === 'class') {
        const removeClasses = `document.documentElement.classList.remove(${attributeValues
          .map((t: string) => `'${t}'`)
          .join(',')})`

        return `${removeClasses};document.documentElement.classList.add(${val})`
      }

      return `document.documentElement.setAttribute('${attribute}', ${val})`
    }

    return (
      <NextHead>
        {forcedTheme ? (
          <script
            key="next-themes-script"
            dangerouslySetInnerHTML={{
              // These are minified via Terser and then updated by hand, don't recommend
              // prettier-ignore
              __html: `!function(){${updateDOM(forcedTheme)}}()`
            }}
          />
        ) : enableSystem ? (
          <script
            key="next-themes-script"
            dangerouslySetInnerHTML={{
              // prettier-ignore
              __html: `!function(){try {var e=localStorage.getItem('${storageKey}');if(!e)return localStorage.setItem('${storageKey}','${defaultTheme}'), void ${updateDOM(defaultTheme)};if("system"===e){var t="(prefers-color-scheme: dark)",m=window.matchMedia(t);m.media!==t||m.matches?${updateDOM('dark')}:${updateDOM('light')}}else ${value ? `var x = ${JSON.stringify(value)};` : ''}${updateDOM(value ? 'x[e]' : 'e', true)}}catch(e){}}()`
            }}
          />
        ) : (
          <script
            key="next-themes-script"
            dangerouslySetInnerHTML={{
              // prettier-ignore
              __html: `!function(){try{var t=localStorage.getItem("${storageKey}");if(!t)return localStorage.setItem("${storageKey}","${defaultTheme}"),void ${updateDOM(defaultTheme)};${value ? `var x = ${JSON.stringify(value)};` : ''}${updateDOM(value ? 'x[t]' : 't', true)}}catch(t){}}();`
            }}
          />
        )}
      </NextHead>
    )
  }
)

// Helpers
const getTheme = (key: string) => {
  if (typeof window === 'undefined') return undefined
  return localStorage.getItem(key) || undefined
}

const disableAnimation = () => {
  const css = document.createElement('style')
  css.appendChild(
    document.createTextNode(
      `*{-webkit-transition: none !important;-moz-transition: none !important;-o-transition: none !important;-ms-transition: none !important;transition: none !important}`
    )
  )
  document.head.appendChild(css)

  return () => {
    // Force restyle
    // The CSS property doesn't matter, use "top" because it's short
    ;(() => window.getComputedStyle(css).top)()
    document.head.removeChild(css)
  }
}
