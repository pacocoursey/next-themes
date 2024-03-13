// @vitest-environment jsdom

import * as React from 'react'
import { act, render, screen } from '@testing-library/react'
import { vi, beforeAll, beforeEach, afterEach, afterAll, describe, test, it, expect } from 'vitest'
import { cleanup } from '@testing-library/react'

import { ThemeProvider, useTheme } from '../src/index'

let originalLocalStorage: Storage
const localStorageMock: Storage = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string): string => store[key] ?? null),
    setItem: vi.fn((key: string, value: string): void => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key: string): void => {
      delete store[key]
    }),
    clear: vi.fn((): void => {
      store = {}
    }),
    key: vi.fn((index: number): string | null => ''),
    length: Object.keys(store).length
  }
})()

// HelperComponent to render the theme inside a paragraph-tag and setting a theme via the forceSetTheme prop
const HelperComponent = ({ forceSetTheme }: { forceSetTheme?: string }) => {
  const { setTheme, theme, forcedTheme, resolvedTheme, systemTheme } = useTheme()

  React.useEffect(() => {
    if (forceSetTheme) {
      setTheme(forceSetTheme)
    }
  }, [forceSetTheme])

  return (
    <>
      <p data-testid="theme">{theme}</p>
      <p data-testid="forcedTheme">{forcedTheme}</p>
      <p data-testid="resolvedTheme">{resolvedTheme}</p>
      <p data-testid="systemTheme">{systemTheme}</p>
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
  originalLocalStorage = window.localStorage
  window.localStorage = localStorageMock
})

beforeEach(() => {
  // Reset window side-effects
  setDeviceTheme('light')
  document.documentElement.style.colorScheme = ''
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('class')

  // Clear the localStorage-mock
  localStorageMock.clear()
})

afterEach(() => {
  cleanup()
})

afterAll(() => {
  window.localStorage = originalLocalStorage
})

describe('defaultTheme', () => {
  test('should return system when no default-theme is set', () => {
    render(
      <ThemeProvider>
        <HelperComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme').textContent).toBe('system')
  })

  test('should return light when no default-theme is set and enableSystem=false', () => {
    render(
      <ThemeProvider enableSystem={false}>
        <HelperComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  test('should return light when light is set as default-theme', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <HelperComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  test('should return dark when dark is set as default-theme', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <HelperComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })
})

describe('provider', () => {
  it('ignores nested ThemeProviders', () => {
    act(() => {
      render(
        <ThemeProvider defaultTheme="dark">
          <ThemeProvider defaultTheme="light">
            <HelperComponent />
          </ThemeProvider>
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })
})

describe('storage', () => {
  test('should not set localStorage with default value', () => {
    act(() => {
      render(
        <ThemeProvider defaultTheme="dark">
          <HelperComponent />
        </ThemeProvider>
      )
    })

    expect(window.localStorage.setItem).toBeCalledTimes(0)
    expect(window.localStorage.getItem('theme')).toBeNull()
  })

  test('should set localStorage when switching themes', () => {
    act(() => {
      render(
        <ThemeProvider>
          <HelperComponent forceSetTheme="dark" />
        </ThemeProvider>
      )
    })

    expect(window.localStorage.setItem).toBeCalledTimes(1)
    expect(window.localStorage.getItem('theme')).toBe('dark')
  })
})

describe('custom storageKey', () => {
  test("should save to localStorage with 'theme' key when using default settings", () => {
    act(() => {
      render(
        <ThemeProvider>
          <HelperComponent forceSetTheme="light" />
        </ThemeProvider>
      )
    })

    expect(window.localStorage.getItem).toHaveBeenCalledWith('theme')
    expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', 'light')
  })

  test("should save to localStorage with 'custom' when setting prop 'storageKey' to 'customKey'", () => {
    act(() => {
      render(
        <ThemeProvider storageKey="customKey">
          <HelperComponent forceSetTheme="light" />
        </ThemeProvider>
      )
    })

    expect(window.localStorage.getItem).toHaveBeenCalledWith('customKey')
    expect(window.localStorage.setItem).toHaveBeenCalledWith('customKey', 'light')
  })
})

describe('custom attribute', () => {
  test('should use data-theme attribute when using default', () => {
    act(() => {
      render(
        <ThemeProvider>
          <HelperComponent forceSetTheme="light" />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  test('should use class attribute (CSS-class) when attribute="class"', () => {
    act(() => {
      render(
        <ThemeProvider attribute="class">
          <HelperComponent forceSetTheme="light" />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.classList.contains('light')).toBeTruthy()
  })

  test('should use "data-example"-attribute when attribute="data-example"', () => {
    act(() => {
      render(
        <ThemeProvider attribute="data-example">
          <HelperComponent forceSetTheme="light" />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.getAttribute('data-example')).toBe('light')
  })
})

describe('custom value-mapping', () => {
  test('should use custom value mapping when using value={{pink:"my-pink-theme"}}', () => {
    localStorageMock.setItem('theme', 'pink')

    act(() => {
      render(
        <ThemeProvider
          themes={['pink', 'light', 'dark', 'system']}
          value={{ pink: 'my-pink-theme' }}
        >
          <HelperComponent forceSetTheme="pink" />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.getAttribute('data-theme')).toBe('my-pink-theme')
    expect(window.localStorage.setItem).toHaveBeenCalledWith('theme', 'pink')
  })

  test('should allow missing values (attribute)', () => {
    act(() => {
      render(
        <ThemeProvider value={{ dark: 'dark-mode' }}>
          <HelperComponent forceSetTheme="light" />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.hasAttribute('data-theme')).toBeFalsy()
  })

  test('should allow missing values (class)', () => {
    act(() => {
      render(
        <ThemeProvider attribute="class" value={{ dark: 'dark-mode' }}>
          <HelperComponent forceSetTheme="light" />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.classList.contains('light')).toBeFalsy()
  })
})

describe('forcedTheme', () => {
  test('should render saved theme when no forcedTheme is set', () => {
    localStorageMock.setItem('theme', 'dark')

    render(
      <ThemeProvider>
        <HelperComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme').textContent).toBe('dark')
    expect(screen.getByTestId('forcedTheme').textContent).toBe('')
  })

  test('should render light theme when forcedTheme is set to light', () => {
    localStorageMock.setItem('theme', 'dark')

    act(() => {
      render(
        <ThemeProvider forcedTheme="light">
          <HelperComponent />
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId('theme').textContent).toBe('dark')
    expect(screen.getByTestId('forcedTheme').textContent).toBe('light')
  })
})

describe('system', () => {
  test('resolved theme should be set', () => {
    setDeviceTheme('dark')

    act(() => {
      render(
        <ThemeProvider>
          <HelperComponent />
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId('theme').textContent).toBe('system')
    expect(screen.getByTestId('forcedTheme').textContent).toBe('')
    expect(screen.getByTestId('resolvedTheme').textContent).toBe('dark')
  })

  test('system theme should be set, even if theme is not system', () => {
    setDeviceTheme('dark')

    act(() => {
      render(
        <ThemeProvider defaultTheme="light">
          <HelperComponent />
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId('theme').textContent).toBe('light')
    expect(screen.getByTestId('forcedTheme').textContent).toBe('')
    expect(screen.getByTestId('resolvedTheme').textContent).toBe('light')
    expect(screen.getByTestId('systemTheme').textContent).toBe('dark')
  })

  test('system theme should not be set if enableSystem is false', () => {
    setDeviceTheme('dark')

    act(() => {
      render(
        <ThemeProvider defaultTheme="light" enableSystem={false}>
          <HelperComponent />
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId('theme').textContent).toBe('light')
    expect(screen.getByTestId('forcedTheme').textContent).toBe('')
    expect(screen.getByTestId('resolvedTheme').textContent).toBe('light')
    expect(screen.getByTestId('systemTheme').textContent).toBe('')
  })
})

describe('color-scheme', () => {
  test('does not set color-scheme when disabled', () => {
    act(() => {
      render(
        <ThemeProvider enableColorScheme={false}>
          <HelperComponent />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.style.colorScheme).toBe('')
  })

  test('should set color-scheme light when light theme is active', () => {
    act(() => {
      render(
        <ThemeProvider>
          <HelperComponent />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  test('should set color-scheme dark when dark theme is active', () => {
    act(() => {
      render(
        <ThemeProvider defaultTheme="dark">
          <HelperComponent forceSetTheme="dark" />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })
})
