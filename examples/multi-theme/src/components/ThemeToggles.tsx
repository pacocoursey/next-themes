'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const themes = ['light', 'dark', 'system'] as const

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {themes.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTheme(t)}
          style={{
            padding: '8px 16px',
            border: theme === t ? '2px solid #000' : '1px solid #ccc',
            borderRadius: '4px',
            background: theme === t ? '#f0f0f0' : 'transparent',
            cursor: 'pointer',
            textTransform: 'capitalize',
          }}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

export default ThemeToggle
