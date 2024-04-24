import * as React from 'react'

interface ValueObject {
  [themeName: string]: string
}

export interface UseThemeProps {
  /** List of all available theme names */
  themes: string[]
  /** Update the theme */
  setTheme: React.Dispatch<React.SetStateAction<string>>
  /** Active theme name
   * 'system' is a special theme name that indicates the theme should be based on the user's system preference
   * 'system' is only returned if `enableSystem` is `true` (which is the default)
   * 'forced' is a special theme name that indicates that a theme was passed using the `forcedTheme` prop.
   * The forced theme value can be accessed using the `resolvedTheme` property.
   */
  theme?: string
  /**
   * If `enableSystem` is true and the active theme is "system", this returns whether the system preference resolved to "dark" or "light".
   * If `forcedTheme` is set, the forced theme value is returned.
   * Otherwise, identical to `theme`.
   */
  resolvedTheme?: string
  /** Forced theme name for the current page */
  forcedTheme?: string | undefined
  /** Update the theme */
  /** If enableSystem is true, returns the System theme preference ("dark" or "light"), regardless what the active theme is */
  systemTheme?: 'dark' | 'light' | undefined
}

export type Attribute = `data-${string}` | 'class'

export interface ThemeProviderProps extends React.PropsWithChildren {
  /** List of all available theme names */
  themes?: string[] | undefined
  /** Forced theme name for the current page */
  forcedTheme?: string | undefined
  /** Whether to switch between dark and light themes based on prefers-color-scheme */
  enableSystem?: boolean | undefined
  /** Disable all CSS transitions when switching themes */
  disableTransitionOnChange?: boolean | undefined
  /** Whether to indicate to browsers which color scheme is used (dark or light) for built-in UI like inputs and buttons */
  enableColorScheme?: boolean | undefined
  /** Key used to store theme setting in localStorage */
  storageKey?: string | undefined
  /** Default theme name (for v0.0.12 and lower the default was light). If `enableSystem` is false, the default theme is light */
  defaultTheme?: string | undefined
  /** HTML attribute modified based on the active theme. Accepts `class`, `data-*` (meaning any data attribute, `data-mode`, `data-color`, etc.), or an array which could include both */
  attribute?: Attribute | Attribute[] | undefined
  /** Mapping of theme name to HTML attribute value. Object where key is the theme name and value is the attribute value */
  value?: ValueObject
  /** Mapping of theme name to theme-color meta tag. CSS color string, or object where key is the theme name and value is the meta tag value */
  themeColor?: string | ValueObject
  /** Nonce string to pass to the inline script for CSP headers */
  nonce?: string | undefined
}
