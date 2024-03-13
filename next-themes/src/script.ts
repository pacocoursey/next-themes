export const script = (...args: any[]) => {
  const [
    attribute,
    storageKey,
    defaultTheme,
    forcedTheme,
    themes,
    value,
    enableSystem,
    enableColorScheme
  ] = args

  const el = document.documentElement
  const media = `(prefers-color-scheme: dark)`
  const systemThemes = ['light', 'dark']
  const isClass = attribute === 'class'
  const classes =
    isClass && !!value
      ? themes.map(t => {
          return value[t] || t
        })
      : themes

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
    return window.matchMedia(media).matches ? 'dark' : 'light'
  }

  ;(function () {
    if (forcedTheme) {
      updateDOM(forcedTheme)
    } else {
      try {
        const e = localStorage.getItem(storageKey)
        const themeName = e || defaultTheme
        const isSystem = enableSystem && themeName === 'system' ? true : false

        const theme = isSystem ? getSystemTheme() : e || defaultTheme
        updateDOM(theme)
      } catch (e) {
        //
      }
    }
  })()
}
