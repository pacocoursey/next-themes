import { act, render, screen } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../src'
import React, { useEffect } from 'react'
import { vi, beforeAll, beforeEach, describe, test, expect } from 'vitest'

let localStorageMock: { [key: string]: string } = {}

// HelperComponent to render the theme inside a paragraph-tag and setting a theme via the forceSetTheme prop
const HelperComponent = ({ forceSetTheme, id }: { forceSetTheme?: string; id: number }) => {
  const { setTheme, theme, forcedTheme, resolvedTheme, systemTheme } = useTheme()

  useEffect(() => {
    if (forceSetTheme) {
      setTheme(forceSetTheme)
    }
  }, [forceSetTheme])

  return (
    <>
      <p data-testid={`${id}_theme`}>{theme}</p>
      <p data-testid={`${id}_forcedTheme`}>{forcedTheme}</p>
      <p data-testid={`${id}_resolvedTheme`}>{resolvedTheme}</p>
      <p data-testid={`${id}_systemTheme`}>{systemTheme}</p>
    </>
  )
}

function setDeviceTheme(theme: 'light' | 'dark') {
  // Create a mock of the window.matchMedia function
  // Based on: https://stackoverflow.com/questions/39830580/jest-test-fails-typeerror-window-matchmedia-is-not-a-function
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: theme === 'dark' ? true : false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  })
}

beforeAll(() => {
  // Create mocks of localStorage getItem and setItem functions
  global.Storage.prototype.getItem = vi.fn((key: string) => localStorageMock[key])
  global.Storage.prototype.setItem = vi.fn((key: string, value: string) => {
    localStorageMock[key] = value
  })
})

beforeEach(() => {
  // Reset global side-effects
  setDeviceTheme('light')
  document.documentElement.style.colorScheme = ''
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('class')

  // Clear the localStorage-mock
  localStorageMock = {}
})

let id = 0

describe('defaultTheme', () => {
  test('should return system when no default-theme is set', () => {
    const i = id++
    render(
      <ThemeProvider>
        <HelperComponent id={i} />
      </ThemeProvider>
    )

    expect(screen.getByTestId(`${i}_theme`).textContent).toBe('system')
  })

  test('should return light when no default-theme is set and enableSystem=false', () => {
    const i = id++
    render(
      <ThemeProvider enableSystem={false}>
        <HelperComponent id={i} />
      </ThemeProvider>
    )

    expect(screen.getByTestId(`${i}_theme`).textContent).toBe('light')
  })

  test('should return light when light is set as default-theme', () => {
    const i = id++
    render(
      <ThemeProvider defaultTheme="light">
        <HelperComponent id={i} />
      </ThemeProvider>
    )

    expect(screen.getByTestId(`${i}_theme`).textContent).toBe('light')
  })

  test('should return dark when dark is set as default-theme', () => {
    const i = id++
    render(
      <ThemeProvider defaultTheme="dark">
        <HelperComponent id={i} />
      </ThemeProvider>
    )

    expect(screen.getByTestId(`${i}_theme`).textContent).toBe('dark')
  })
})

describe('provider', () => {
  test('ignores nested ThemeProviders', () => {
    const i = id++
    act(() => {
      render(
        <ThemeProvider defaultTheme="dark">
          <ThemeProvider defaultTheme="light">
            <HelperComponent id={i} />
          </ThemeProvider>
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId(`${i}_theme`).textContent).toBe('dark')
  })
})

describe('storage', () => {
  test('should not set localStorage with default value', () => {
    const i = id++
    act(() => {
      render(
        <ThemeProvider defaultTheme="dark">
          <HelperComponent id={i} />
        </ThemeProvider>
      )
    })

    expect(global.Storage.prototype.setItem).toBeCalledTimes(0)
    expect(global.Storage.prototype.getItem('theme')).toBeUndefined()
  })

  test('should set localStorage when switching themes', () => {
    const i = id++
    act(() => {
      render(
        <ThemeProvider>
          <HelperComponent forceSetTheme="dark" id={i} />
        </ThemeProvider>
      )
    })

    expect(global.Storage.prototype.setItem).toBeCalledTimes(1)
    expect(global.Storage.prototype.getItem('theme')).toBe('dark')
  })
})

describe('custom storageKey', () => {
  test("should save to localStorage with 'theme' key when using default settings", () => {
    const i = id++
    act(() => {
      render(
        <ThemeProvider>
          <HelperComponent forceSetTheme="light" id={i} />
        </ThemeProvider>
      )
    })

    expect(global.Storage.prototype.getItem).toHaveBeenCalledWith('theme')
    expect(global.Storage.prototype.setItem).toHaveBeenCalledWith('theme', 'light')
  })

  test("should save to localStorage with 'custom' when setting prop 'storageKey' to 'customKey'", () => {
    const i = id++
    act(() => {
      render(
        <ThemeProvider storageKey="customKey">
          <HelperComponent forceSetTheme="light" id={i} />
        </ThemeProvider>
      )
    })

    expect(global.Storage.prototype.getItem).toHaveBeenCalledWith('customKey')
    expect(global.Storage.prototype.setItem).toHaveBeenCalledWith('customKey', 'light')
  })
})

describe('custom attribute', () => {
  test('should use data-theme attribute when using default', () => {
    const i = id++
    act(() => {
      render(
        <ThemeProvider>
          <HelperComponent forceSetTheme="light" id={i} />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  test('should use class attribute (CSS-class) when attribute="class"', () => {
    const i = id++
    act(() => {
      render(
        <ThemeProvider attribute="class">
          <HelperComponent forceSetTheme="light" id={i} />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.classList.contains('light')).toBeTruthy()
  })

  test('should use "data-example"-attribute when attribute="data-example"', () => {
    const i = id++
    act(() => {
      render(
        <ThemeProvider attribute="data-example">
          <HelperComponent forceSetTheme="light" id={i} />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.getAttribute('data-example')).toBe('light')
  })
})

describe('custom value-mapping', () => {
  test('should use custom value mapping when using value={{pink:"my-pink-theme"}}', () => {
    localStorageMock['theme'] = 'pink'
    const i = id++
    act(() => {
      render(
        <ThemeProvider
          themes={['pink', 'light', 'dark', 'system']}
          value={{ pink: 'my-pink-theme' }}
        >
          <HelperComponent forceSetTheme="pink" id={i} />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.getAttribute('data-theme')).toBe('my-pink-theme')
    expect(global.Storage.prototype.setItem).toHaveBeenCalledWith('theme', 'pink')
  })

  test('should allow missing values (attribute)', () => {
    const i = id++
    act(() => {
      render(
        <ThemeProvider value={{ dark: 'dark-mode' }}>
          <HelperComponent forceSetTheme="light" id={i} />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.hasAttribute('data-theme')).toBeFalsy()
  })

  test('should allow missing values (class)', () => {
    const i = id++
    act(() => {
      render(
        <ThemeProvider attribute="class" value={{ dark: 'dark-mode' }}>
          <HelperComponent forceSetTheme="light" id={i} />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.classList.contains('light')).toBeFalsy()
  })
})

describe('forcedTheme', () => {
  test('should render saved theme when no forcedTheme is set', () => {
    localStorageMock['theme'] = 'dark'
    const i = id++
    render(
      <ThemeProvider>
        <HelperComponent id={i} />
      </ThemeProvider>
    )

    expect(screen.getByTestId(`${i}_theme`).textContent).toBe('dark')
    expect(screen.getByTestId(`${i}_forcedTheme`).textContent).toBe('')
  })

  test('should render light theme when forcedTheme is set to light', () => {
    localStorageMock['theme'] = 'dark'
    const i = id++
    act(() => {
      render(
        <ThemeProvider forcedTheme="light">
          <HelperComponent id={i} />
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId(`${i}_theme`).textContent).toBe('dark')
    expect(screen.getByTestId(`${i}_forcedTheme`).textContent).toBe('light')
  })
})

describe('system', () => {
  test('resolved theme should be set', () => {
    setDeviceTheme('dark')
    const i = id++
    act(() => {
      render(
        <ThemeProvider>
          <HelperComponent id={i} />
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId(`${i}_theme`).textContent).toBe('system')
    expect(screen.getByTestId(`${i}_forcedTheme`).textContent).toBe('')
    expect(screen.getByTestId(`${i}_resolvedTheme`).textContent).toBe('dark')
  })

  test('system theme should be set, even if theme is not system', () => {
    setDeviceTheme('dark')
    const i = id++
    act(() => {
      render(
        <ThemeProvider defaultTheme="light">
          <HelperComponent id={i} />
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId(`${i}_theme`).textContent).toBe('light')
    expect(screen.getByTestId(`${i}_forcedTheme`).textContent).toBe('')
    expect(screen.getByTestId(`${i}_resolvedTheme`).textContent).toBe('light')
    expect(screen.getByTestId(`${i}_systemTheme`).textContent).toBe('dark')
  })

  test('system theme should not be set if enableSystem is false', () => {
    setDeviceTheme('dark')
    const i = id++
    act(() => {
      render(
        <ThemeProvider defaultTheme="light" enableSystem={false}>
          <HelperComponent id={i} />
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId(`${i}_theme`).textContent).toBe('light')
    expect(screen.getByTestId(`${i}_forcedTheme`).textContent).toBe('')
    expect(screen.getByTestId(`${i}_resolvedTheme`).textContent).toBe('light')
    expect(screen.getByTestId(`${i}_systemTheme`).textContent).toBe('')
  })
})

describe('color-scheme', () => {
  test('does not set color-scheme when disabled', () => {
    const i = id++
    act(() => {
      render(
        <ThemeProvider enableColorScheme={false}>
          <HelperComponent id={i} />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.style.colorScheme).toBe('')
  })

  test('should set color-scheme light when light theme is active', () => {
    const i = id++
    act(() => {
      render(
        <ThemeProvider>
          <HelperComponent id={i} />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  test('should set color-scheme dark when dark theme is active', () => {
    const i = id++
    act(() => {
      render(
        <ThemeProvider defaultTheme="dark">
          <HelperComponent forceSetTheme="dark" id={i} />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })
})
