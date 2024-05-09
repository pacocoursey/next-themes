import { getCookieStorage } from './cookie-storage'

export const script = (
  attribute,
  storageConfig,
  storageKey,
  defaultTheme,
  forcedTheme,
  themes,
  value,
  enableSystem,
  enableColorScheme
) => {
  const el = document.documentElement
  const systemThemes = ['light', 'dark']
  const isClass = attribute === 'class'
  const classes = isClass && value ? themes.map(t => value[t] || t) : themes

  function updateDOM(theme: string) {
    if (isClass) {
      el.classList.remove(...classes)
      el.classList.add(theme)
    } else {
      el.setAttribute(attribute, theme)
    }

    setColorScheme(theme)
  }

  function setColorScheme(theme: string) {
    if (enableColorScheme && systemThemes.includes(theme)) {
      el.style.colorScheme = theme
    }
  }

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  function getStorage() {
    if (storageConfig === 'cookie') {
      return getCookieStorage()
    }
    if (storageConfig === 'sessionStorage') {
      return window.sessionStorage
    }
    return window.localStorage
  }

  if (forcedTheme) {
    updateDOM(forcedTheme)
  } else {
    try {
      const storage = getStorage()
      const themeName = storage.getItem(storageKey) || defaultTheme
      const isSystem = enableSystem && themeName === 'system'
      const theme = isSystem ? getSystemTheme() : themeName
      updateDOM(theme)
    } catch (e) {
      //
    }
  }
}
