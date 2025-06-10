import type { Contrast } from './types'

export const script = (
  attribute,
  storageKey,
  defaultContrast,
  forcedContrast,
  value
) => {
  const el = document.documentElement
  const contrasts: Record<Contrast, string> = {more: 'more-contrast', less: 'less-contrast', 'no-preference': 'no-preference-contrast'}

  function updateDOM(contrast: string) {
    const attributes = Array.isArray(attribute) ? attribute : [attribute]

    attributes.forEach(attr => {
      const isClass = attr === 'class'
      const classes = isClass && value ? Object.entries(contrasts).map(([k, v]) => value[k] || v) : Object.values(contrasts)
      if (isClass) {
        el.classList.remove(...classes)
        el.classList.add(value && value[contrast] ? value[contrast] : contrasts[contrast])
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
