'use client'

import * as React from 'react'
import { script } from './script'
import type {
  Attribute,
  Contrast,
  ContrastProviderProps,
  UseContrastProps,
} from './types'

const CONTRAST_LESS_MEDIA = '(prefers-contrast: less)'
const CONTRAST_MORE_MEDIA = '(prefers-contrast: more)'
const isServer = typeof window === 'undefined'

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

export const useContrast = () => React.useContext(ContrastContext) ?? defaultContrastContext

export const ContrastProvider = (props: ContrastProviderProps) => {
  const context = React.useContext(ContrastContext)

  // Ignore nested context providers, just passthrough children
  if (context) return <>{props.children}</>
  return <ContrastProviderInternal {...props} />
}

const defaultContrasts: Record<Contrast, string> = {more: 'more-contrast', less: 'less-contrast', 'no-preference': 'no-preference-contrast'}

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
  const [contrast, setContrastState] = React.useState<Contrast>(() => getStoredContrast(storageKey, defaultContrast))
  const attrs = !value ? Object.values(defaultContrasts) : Object.values(value)

  const applyContrast = React.useCallback(contrast => {
    if (!contrast) return

    const enable = disableTransitionOnChange ? disableAnimation(nonce) : null

    const d = document.documentElement

    const handleAttribute = (attr: Attribute) => {
      if (attr === 'class') {
        const name = value ? value[contrast] : defaultContrasts[contrast]
        d.classList.remove(...attrs)
        if (name) d.classList.add(name)
      } else if (attr.startsWith('data-')) {
        const name = value ? value[contrast] : contrast
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
      if (getStoredContrast(storageKey, defaultContrast)) return
      setContrastState(resolved)

      if (!forcedContrast) {
        applyContrast(resolved)
      }
    },
    [storageKey, defaultContrast, forcedContrast]
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

export const ContrastScript = React.memo(
  ({
    forcedContrast,
    storageKey,
    attribute,
    defaultContrast,
    value,
    nonce,
    scriptProps
  }: Omit<ContrastProviderProps, 'children'> & { defaultContrast: string}) => {
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
        dangerouslySetInnerHTML={{ __html: `(${script.toString()})(${scriptArgs})` }}
      />
    )
  }
)

// Helpers
const getStoredContrast = (key: string, fallback?: string) => {
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

const getSystemContrast = (e?: MediaQueryList | MediaQueryListEvent): Contrast => {
  if (!e) e = window.matchMedia(CONTRAST_MORE_MEDIA)
  if (e.matches) return 'more'

  e = window.matchMedia(CONTRAST_LESS_MEDIA)
  if (e.matches) return 'less'

  return 'no-preference'
}

// Re-export types
export type { Attribute, Contrast, UseContrastProps } from './types'
