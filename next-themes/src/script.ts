export const scriptTheme = (
  attribute,
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

  function updateDOM(theme: string) {
    const attributes = Array.isArray(attribute) ? attribute : [attribute]

    attributes.forEach(attr => {
      const isClass = attr === 'class'
      const classes = isClass && value ? themes.map(t => value[t] || t) : themes
      if (isClass) {
        el.classList.remove(...classes)
        el.classList.add(value && value[theme] ? value[theme] : theme)
      } else {
        el.setAttribute(attr, theme)
      }
    })

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

  if (forcedTheme) {
    updateDOM(forcedTheme)
  } else {
    try {
      const themeName = localStorage.getItem(storageKey) || defaultTheme
      const isSystem = enableSystem && themeName === 'system'
      const theme = isSystem ? getSystemTheme() : themeName
      updateDOM(theme)
    } catch (e) {
      //
    }
  }
}

export const scriptContrast = (
  attribute,
  storageKey,
  defaultContrast,
  forcedContrast,
  value
) => {
  const el = document.documentElement
  const contrasts = ['more', 'less', 'no-preference']

  function updateDOM(contrast: string) {
    const attributes = Array.isArray(attribute) ? attribute : [attribute]

    attributes.forEach(attr => {
      const isClass = attr === 'class'
      const classes = isClass && value ? contrasts.map(k => value[k] || k) : contrasts
      if (isClass) {
        el.classList.remove(...classes)
        el.classList.add(value && value[contrast] ? value[contrast] : contrast)
      } else {
        el.setAttribute(attr, contrast)
      }
    })
  }

  if (forcedContrast) {
    updateDOM(forcedContrast)
  } else {
    try {
      const contrast = localStorage.getItem(storageKey) || defaultContrast
      updateDOM(contrast)
    } catch (e) {
      //
    }
  }
}
