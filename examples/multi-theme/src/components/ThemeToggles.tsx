'use client'

import { useTheme } from 'next-themes'

function ThemeToggles() {
  const { theme, setTheme } = useTheme()
  const themeMapping = {
    light: 'Default',
    'dark-classic': 'Dark',
    tangerine: 'Tangerine',
    'dark-tangerine': 'Tangerine (dark)',
    mint: 'Mint',
    'dark-mint': 'Mint (dark)'
  }

  return (
    <div className="mt-16 grid grid-cols-3 grid-rows-2 grid-flow-col gap-4">
      {Object.entries(themeMapping).map(([key, value]) => (
        <button
          key={key}
          className={`px-4 py-2 font-semibold rounded-md ${
            theme == key
              ? 'border border-primary bg-primary-foreground text-primary'
              : 'bg-primary text-primary-foreground'
          }`}
          onClick={() => {
            setTheme(key)
          }}
        >
          {value}
        </button>
      ))}
    </div>
  )
}

export default ThemeToggles
