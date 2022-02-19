// @ts-ignore
import NextScript from 'next/script'
// @ts-ignore
import NextHead from 'next/head'
import React, { createContext, useCallback, useContext, useEffect, useState, memo } from 'react'
import { ThemeProviderProps, UseThemeProps } from './types'

const colorSchemes = ['light', 'dark']
const MEDIA = '(prefers-color-scheme: dark)'
const ThemeContext = createContext<UseThemeProps>({ setTheme: _ => {}, themes: [] })

export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  forcedTheme,
  disableTransitionOnChange = false,
  enableSystem = true,
  enableColorScheme = true,
  storageKey = 'theme',
  themes = ['light', 'dark'],
  defaultTheme = enableSystem ? 'system' : 'light',
  attribute = 'data-theme',
  value,
  children
}) => {
  const [theme, setThemeState] = useState(() => getTheme(storageKey, defaultTheme))
  const [resolvedTheme, setResolvedTheme] = useState(() => getTheme(storageKey))
  const attrs = !value ? themes : Object.values(value)

  const applyTheme = useCallback(
    theme => {
      let resolved = theme

      // If theme is system, resolve it before setting theme
      if (theme === 'system' && enableSystem) {
        resolved = getSystemTheme()
      }

      const name = value ? value[resolved] : resolved
      const enable = disableTransitionOnChange ? disableAnimation() : null
      const d = document.documentElement

      if (attribute === 'class') {
        d.classList.remove(...attrs)

        if (name) d.classList.add(name)
      } else {
        // ?? '' acts as removing the attribute, like d.classList.remove above
        // name can be null here, but we don't want data-theme="undefined"
        d.setAttribute(attribute, name ?? '')
      }

      if (enableColorScheme) {
        const fallback = colorSchemes.includes(defaultTheme) ? defaultTheme : null
        const colorScheme = colorSchemes.includes(resolved) ? resolved : fallback

        // @ts-ignore
        d.style.colorScheme = colorScheme
      }

      enable?.()
    },
    [value, attribute, disableTransitionOnChange, defaultTheme, enableColorScheme]
  )

  const setTheme = useCallback(
    newTheme => {
      // If there is a forced theme, changing the theme is a no-op
      if (forcedTheme) return

      applyTheme(newTheme)
      setThemeState(newTheme)
    },
    [forcedTheme, applyTheme]
  )

  const handleMediaQuery = useCallback(
    (e: MediaQueryListEvent | MediaQueryList) => {
      const resolved = getSystemTheme(e)
      setResolvedTheme(resolved)

      if (theme === 'system' && enableSystem && !forcedTheme) {
        applyTheme('system')
      }
    },
    [theme, applyTheme, forcedTheme]
  )

  // Always listen to System preference
  useEffect(() => {
    const media = window.matchMedia(MEDIA)

    // Intentionally use deprecated listener methods to support iOS & old browsers
    media.addListener(handleMediaQuery)
    handleMediaQuery(media)

    return () => media.removeListener(handleMediaQuery)
  }, [handleMediaQuery])

  // localStorage event handling
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) {
        return
      }

      // If default theme set, use it if localstorage === null (happens on local storage manual deletion)
      const theme = e.newValue || defaultTheme
      setTheme(theme)
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [setTheme])

  // Update storage provider when theme changes
  useEffect(() => {
    if (!theme) return

    try {
      localStorage.setItem(storageKey, theme)
    } catch (e) {
      // Unsupported
    }
  }, [theme])

  useEffect(() => {
    if (forcedTheme) {
      applyTheme(forcedTheme)
    }
  }, [forcedTheme])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        forcedTheme,
        resolvedTheme: theme === 'system' ? resolvedTheme : theme,
        themes: enableSystem ? [...themes, 'system'] : themes,
        systemTheme: (enableSystem ? resolvedTheme : undefined) as 'light' | 'dark' | undefined
      }}
    >
      <ThemeScript
        {...{
          forcedTheme,
          storageKey,
          attribute,
          value,
          enableSystem,
          enableColorScheme,
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
    enableColorScheme,
    defaultTheme,
    value,
    attrs
  }: ThemeProviderProps & { attrs: string[]; defaultTheme: string }) => {
    const defaultSystem = defaultTheme === 'system'

    // Code-golfing the amount of characters in the script
    const optimization = (() => {
      if (attribute === 'class') {
        const removeClasses = `d.remove(${attrs.map((t: string) => `'${t}'`).join(',')})`

        return `var d=document.documentElement.classList;${removeClasses};`
      } else {
        return `var d=document.documentElement;var n='${attribute}';var s = 'setAttribute';`
      }
    })()

    const fallbackColorScheme = (() => {
      if (!enableColorScheme) {
        return ''
      }

      const fallback = colorSchemes.includes(defaultTheme) ? defaultTheme : null

      if (fallback) {
        return `if(e==='light'||e==='dark'||!e)d.style.colorScheme=e||'${defaultTheme}'`
      } else {
        return `if(e==='light'||e==='dark')d.style.colorScheme=e`
      }
    })()

    const updateDOM = (name: string, literal: boolean = false, setColorScheme = true) => {
      const resolvedName = value ? value[name] : name
      const val = literal ? name + `|| ''` : `'${resolvedName}'`
      let text = ''

      // MUCH faster to set colorScheme alongside HTML attribute/class
      // as it only incurs 1 style recalculation rather than 2
      // This can save over 250ms of work for pages with big DOM
      if (enableColorScheme && setColorScheme && !literal && colorSchemes.includes(name)) {
        text += `d.style.colorScheme = '${name}';`
      }

      if (attribute === 'class') {
        if (literal || resolvedName) {
          text += `d.add(${val})`
        } else {
          text += `null`
        }
      } else {
        text += `d[s](n, ${resolvedName ? val : `''`})`
      }

      return text
    }

    const scriptSrc = (() => {
      if (forcedTheme) {
        return `!function(){${optimization}${updateDOM(forcedTheme)}}()`
      }

      if (enableSystem) {
        return `!function(){try {${optimization}var e=localStorage.getItem('${storageKey}');if("system"===e||(!e&&${defaultSystem})){var t="${MEDIA}",m=window.matchMedia(t);if(m.media!==t||m.matches){${updateDOM(
          'dark'
        )}}else{${updateDOM('light')}}}else if(e){${
          value ? `var x=${JSON.stringify(value)};` : ''
        }${updateDOM(value ? `x[e]` : 'e', true)}}${
          !defaultSystem ? `else{` + updateDOM(defaultTheme, false, false) + '}' : ''
        }${fallbackColorScheme}}catch(e){}}()`
      }

      return `!function(){try{${optimization}var e=localStorage.getItem("${storageKey}");if(e){${
        value ? `var x=${JSON.stringify(value)};` : ''
      }${updateDOM(value ? `x[e]` : 'e', true)}}else{${updateDOM(
        defaultTheme,
        false,
        false
      )};}${fallbackColorScheme}}catch(t){}}();`
    })()

    // We MUST use next/script's `beforeInteractive` strategy to avoid flashing on load.
    // However, it only accepts the `src` prop, not `dangerouslySetInnerHTML` or `children`
    // But our script cannot be external because it changes at runtime based on React props
    // so we trick next/script by passing `src` as a base64 JS script
    const encodedScript = `data:text/javascript;base64,${btoa(scriptSrc)}`
    return <NextScript id="next-themes-script" strategy="beforeInteractive" src={encodedScript} />
  },
  // Never re-render this component
  () => true
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

const getSystemTheme = (e?: MediaQueryList | MediaQueryListEvent) => {
  if (!e) e = window.matchMedia(MEDIA)
  const isDark = e.matches
  const systemTheme = isDark ? 'dark' : 'light'
  return systemTheme
}
