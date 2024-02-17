'use client'

import { useTheme } from 'next-themes'

function ThemeToggles() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="mt-16 grid grid-cols-3 grid-rows-2 grid-flow-col gap-4">
      <button
        className={`px-4 py-2 font-semibold rounded-md ${
          theme == 'light'
            ? 'border border-primary bg-primary-foreground text-primary'
            : 'bg-primary text-primary-foreground'
        }`}
        onClick={() => {
          setTheme('light')
        }}
      >
        Default
      </button>
      <button
        className={`px-4 py-2 font-semibold rounded-md ${
          theme == 'dark-classic'
            ? 'border border-primary bg-primary-foreground text-primary'
            : 'bg-primary text-primary-foreground'
        }`}
        onClick={() => {
          setTheme('dark-classic')
        }}
      >
        Dark
      </button>
      <button
        className={`px-4 py-2 font-semibold rounded-md ${
          theme == 'tangerine'
            ? 'border border-primary bg-primary-foreground text-primary'
            : 'bg-primary text-primary-foreground'
        }`}
        onClick={() => {
          setTheme('tangerine')
        }}
      >
        Tangerine
      </button>
      <button
        className={`px-4 py-2 font-semibold rounded-md ${
          theme == 'dark-tangerine'
            ? 'border border-primary bg-primary-foreground text-primary'
            : 'bg-primary text-primary-foreground'
        }`}
        onClick={() => {
          setTheme('dark-tangerine')
        }}
      >
        Tangerine (dark)
      </button>
      <button
        className={`px-4 py-2 font-semibold rounded-md ${
          theme == 'mint'
            ? 'border border-primary bg-primary-foreground text-primary'
            : 'bg-primary text-primary-foreground'
        }`}
        onClick={() => {
          setTheme('mint')
        }}
      >
        Mint
      </button>
      <button
        className={`px-4 py-2 font-semibold rounded-md ${
          theme == 'dark-mint'
            ? 'border border-primary bg-primary-foreground text-primary'
            : 'bg-primary text-primary-foreground'
        }`}
        onClick={() => {
          setTheme('dark-mint')
        }}
      >
        Mint (dark)
      </button>
    </div>
  )
}

export default ThemeToggles
