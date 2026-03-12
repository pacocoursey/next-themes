'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          disabled
          style={{
            padding: '8px 16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: 'transparent',
            cursor: 'not-allowed',
            opacity: 0.6,
          }}
        >
          Light
        </button>
        <button
          type="button"
          disabled
          style={{
            padding: '8px 16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: 'transparent',
            cursor: 'not-allowed',
            opacity: 0.6,
          }}
        >
          Dark
        </button>
        <button
          type="button"
          disabled
          style={{
            padding: '8px 16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: 'transparent',
            cursor: 'not-allowed',
            opacity: 0.6,
          }}
        >
          System
        </button>
      </div>
    )
  }

  const availableThemes = ['light', 'dark', 'system'] as const

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {availableThemes.map((currentTheme) => {
        const isActive = theme === currentTheme

        return (
          <button
            key={currentTheme}
            type="button"
            onClick={() => setTheme(currentTheme)}
            aria-pressed={isActive}
            style={{
              padding: '8px 16px',
              border: isActive ? '2px solid #000' : '1px solid #ccc',
              borderRadius: '4px',
              background: isActive ? '#f0f0f0' : 'transparent',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {currentTheme}
          </button>
        )
      })}
    </div>
  )
}
