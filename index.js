import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  memo
} from 'react'
import NextHead from 'next/head'

const ThemeContext = createContext({
  setTheme: _ => {},
  theme: undefined,
  resolvedTheme: undefined,
  themes: []
})
export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider = ({
  forcedTheme,
  disableTransitionOnChange,
  enableSystem = true,
  storageKey = 'theme',
  themes = ['light', 'dark'],
  attribute,
  value,
  defaultTheme,
  children
}) => {
  const [theme, setThemeState] = useState(() => getTheme(storageKey))
  const [resolvedTheme, setResolvedTheme] = useState(() => getTheme(storageKey))

  const changeTheme = useCallback((key, theme, storageTheme = theme) => {
    const attributeValues = !value ? themes : Object.values(value)
    const name = value?.[theme] || theme

    const enable = disableTransitionOnChange ? disableAnimation() : null
    localStorage.setItem(key, storageTheme)

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
    e => {
      const isDark = e.matches
      const theme = isDark ? 'dark' : 'light'
      changeTheme(storageKey, theme, 'system')
      setResolvedTheme(theme)
      setThemeState('system')
    },
    // All of these deps are stable and should never change
    [] // eslint-disable-line
  )

  useEffect(() => {
    const t = forcedTheme || theme
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    if (t === 'system') {
      media.addListener(handleMediaQuery)
      handleMediaQuery(media)
    }

    return () => media.removeListener(handleMediaQuery)
  }, [theme, forcedTheme, handleMediaQuery])

  const setTheme = useCallback(
    newTheme => {
      if (forcedTheme) {
        console.warn('Cannot setTheme on a page with a forced theme.')
        return
      }

      // If it's not system we can update right away
      if (newTheme !== 'system') {
        changeTheme(storageKey, newTheme)
        setThemeState(newTheme)
      } else {
        const media = window.matchMedia('(prefers-color-scheme: dark)')
        handleMediaQuery(media)
      }
    },
    // All of these deps are stable and should never change
    [] // eslint-disable-line
  )

  useEffect(() => {
    const handleStorage = e => {
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

  if (attribute !== 'class' && !attribute.startsWith('data-')) {
    throw new Error(
      `Invalid attribute "${attribute}". Should be "class" or "data-*".`
    )
  }

  if (themes.includes('system')) {
    throw new Error(
      '"system" is a reserved theme name. Use `enableSystem` instead.'
    )
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme: theme === 'system' ? resolvedTheme : theme,
        themes: enableSystem ? [...themes, 'system'] : themes
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
  }) => {
    const updateDOM = (name, literal) => {
      const attributeValues = !value ? themes : Object.values(value)
      if (value) {
        name = value[name] || name
      }
      const val = literal ? name : `'${name}'`
      if (attribute === 'class') {
        const removeClasses = `document.documentElement.classList.remove(${attributeValues
          .map(t => `'${t}'`)
          .join(',')});`

        return `${removeClasses}document.documentElement.classList.add(${val});`
      }

      return `document.documentElement.setAttribute('${attribute}', ${val});`
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
              __html: `!function(){try {var e=localStorage.getItem('${storageKey}');if(!e)return localStorage.setItem('${storageKey}','${defaultTheme}'), void ${updateDOM(defaultTheme)}if("system"===e){var t="(prefers-color-scheme: dark)",m=window.matchMedia(t);m.media!==t||m.matches?${updateDOM('dark')}:${updateDOM('light')}else ${value ? `var modes = ${JSON.stringify(value)};` : ''}${updateDOM(value ? 'modes[mode]' : 'mode', true)}}catch(e){}}()`
            }}
          />
        ) : (
          <script
            key="next-themes-script"
            dangerouslySetInnerHTML={{
              // prettier-ignore
              __html: `!function(){try{var t=localStorage.getItem("${storageKey}");if(!t)return localStorage.setItem("${storageKey}","${defaultTheme}"),void ${updateDOM(defaultTheme)}${value ? `var modes = ${JSON.stringify(value)};` : ''}${updateDOM(value ? 'modes[mode]' : 'mode', true)}}catch(t){}}();`
            }}
          />
        )}
      </NextHead>
    )
  }
)

ThemeScript.displayName = 'NextThemesScript'

// Helpers
const getTheme = key => {
  if (typeof window === 'undefined') return undefined
  return localStorage.getItem(key) || undefined
}

const disableAnimation = () => {
  const css = document.createElement('style')
  css.type = 'text/css'
  css.appendChild(
    document.createTextNode(
      `*{-webkit-transition: none !important;-moz-transition: none !important;-o-transition: none !important;-ms-transition: none !important;transition: none !important}`
    )
  )
  document.head.appendChild(css)

  return () => {
    // Force restyle
    ;(() => window.getComputedStyle(css).opacity)()
    document.head.removeChild(css)
  }
}
