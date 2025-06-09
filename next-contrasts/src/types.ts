import * as React from 'react'

type DataAttribute = `data-${string}`

interface ScriptProps
  extends React.DetailedHTMLProps<
    React.ScriptHTMLAttributes<HTMLScriptElement>,
    HTMLScriptElement
  > {
  [dataAttribute: DataAttribute]: any
}

export type Contrast = 'more' | 'less' | 'no-preference'

export interface UseContrastProps {
  contrast?: Contrast | undefined
  forcedContrast?: Contrast | undefined
  setContrast: React.Dispatch<React.SetStateAction<Contrast>>
}

export type Attribute = DataAttribute | 'class'

export interface ContrastProviderProps extends React.PropsWithChildren<unknown> {
  /** Forced contrast name for the current page */
  forcedContrast?: Contrast | undefined
  /** Disable all CSS transitions when switching contrast */
  disableTransitionOnChange?: boolean | undefined
  /** Key used to store contrast setting in localStorage */
  storageKey?: string | undefined
  /** Default contrast name */
  defaultContrast?: Contrast | undefined
  /** HTML attribute modified based on the active thecontrastme. Accepts `class`, `data-*` (meaning any data attribute, `data-mode`, `data-color`, etc.), or an array which could include both */
  attribute?: Attribute | Attribute[] | undefined
  /** Mapping of contrast name to HTML attribute value. Object where key is the contrast name and value is the attribute value */
  value?: Partial<Record<Contrast, string>> | undefined
  /** Nonce string to pass to the inline script and style elements for CSP headers */
  nonce?: string
  /** Props to pass the inline script */
  scriptProps?: ScriptProps
}
