import { act, render, RenderResult, screen, waitFor } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../src'
import React, { useEffect } from 'react'

let localStorageMock: { [key: string]: string } = {}
let storageEventListenerMock = jest.fn()

// HelperComponent to render the theme inside a paragraph-tag and setting a theme via the forceSetTheme prop
const HelperComponent = ({ forceSetTheme }: { forceSetTheme?: string }) => {
  const { setTheme, theme, resolvedTheme, systemTheme } = useTheme()

  useEffect(() => {
    if (forceSetTheme) {
      setTheme(forceSetTheme)
    }
  }, [forceSetTheme])

  return (
    <>
      <p data-testid="theme">{theme}</p>
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
    value: jest.fn().mockImplementation(query => ({
      matches: theme === 'dark' ? true : false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    }))
  })

  window.addEventListener('storage', jest.fn())
}

function makeStorageEvent(key: string, newValue: string, oldValue?: string): StorageEvent {
  return new StorageEvent('storage', {
    key,
    newValue,
    oldValue
  })
}

beforeAll(() => {
  // Create mocks of localStorage getItem and setItem functions
  global.Storage.prototype.getItem = jest.fn((key: string) => localStorageMock[key])
  global.Storage.prototype.setItem = jest.fn((key: string, value: string) => {
    const oldValue = localStorageMock[key]
    localStorageMock[key] = value
    // Dispatch window event used to update the theme
    window.dispatchEvent(makeStorageEvent(key, value, oldValue))
  })

  window.addEventListener('storage', storageEventListenerMock)
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

describe('defaultTheme', () => {
  test('should return system when no default-theme is set', () => {
    act(() => {
      render(
        <ThemeProvider>
          <HelperComponent />
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId('theme').textContent).toBe('system')
  })

  test('should return light when no default-theme is set and enableSystem=false', () => {
    act(() => {
      render(
        <ThemeProvider enableSystem={false}>
          <HelperComponent />
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  test('should return light when light is set as default-theme', () => {
    act(() => {
      render(
        <ThemeProvider defaultTheme="light">
          <HelperComponent />
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  test('should return dark when dark is set as default-theme', () => {
    act(() => {
      render(
        <ThemeProvider defaultTheme="dark">
          <HelperComponent />
        </ThemeProvider>
      )
    })

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

    expect(global.Storage.prototype.setItem).toBeCalledTimes(0)
    expect(global.Storage.prototype.getItem('theme')).toBeUndefined()
  })

  test('should set localStorage when switching themes', () => {
    act(() => {
      render(
        <ThemeProvider>
          <HelperComponent forceSetTheme="dark" />
        </ThemeProvider>
      )
    })

    expect(global.Storage.prototype.setItem).toBeCalledTimes(1)
    expect(global.Storage.prototype.getItem('theme')).toBe('dark')
  })

  test('should update theme based on storage event', async () => {
    localStorageMock['theme'] = 'dark'

    act(() => {
      render(
        <ThemeProvider>
          <HelperComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('resolvedTheme').textContent).toBe('dark')
    })

    const event = makeStorageEvent('theme', 'light', 'dark')

    act(() => {
      window.dispatchEvent(event)
    })

    // Expect another call to have been made
    expect(storageEventListenerMock).toHaveBeenCalledWith(event)
    expect(screen.getByTestId('resolvedTheme').textContent).toBe('light')
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

    expect(global.Storage.prototype.getItem).toHaveBeenCalledWith('theme')
    expect(global.Storage.prototype.setItem).toHaveBeenCalledWith('theme', 'light')
  })

  test("should save to localStorage with 'custom' when setting prop 'storageKey' to 'customKey'", () => {
    act(() => {
      render(
        <ThemeProvider storageKey="customKey">
          <HelperComponent forceSetTheme="light" />
        </ThemeProvider>
      )
    })

    expect(global.Storage.prototype.getItem).toHaveBeenCalledWith('customKey')
    expect(global.Storage.prototype.setItem).toHaveBeenCalledWith('customKey', 'light')
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
    localStorageMock['theme'] = 'pink'

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
    expect(global.Storage.prototype.setItem).toHaveBeenCalledWith('theme', 'pink')
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
  test('should render saved theme when forcedTheme is not set', () => {
    localStorageMock['theme'] = 'dark'

    act(() => {
      render(
        <ThemeProvider>
          <HelperComponent />
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId('theme').textContent).toBe('dark')
    expect(screen.getByTestId('resolvedTheme').textContent).toBe('dark')
  })

  test('should render light theme when forcedTheme is set to "light"', () => {
    localStorageMock['theme'] = 'dark'

    act(() => {
      render(
        <ThemeProvider forcedTheme="light">
          <HelperComponent />
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId('theme').textContent).toBe('forced')
    expect(screen.getByTestId('resolvedTheme').textContent).toBe('light')
  })

  test('should ignore storage events when forcedTheme is set', () => {
    localStorageMock['theme'] = 'dark'

    act(() => {
      render(
        <ThemeProvider forcedTheme="light">
          <HelperComponent />
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId('theme').textContent).toBe('forced')
    expect(screen.getByTestId('resolvedTheme').textContent).toBe('light')

    const event = makeStorageEvent('theme','dark','light')

    act(() => {
      window.dispatchEvent(event)
    })

    expect(storageEventListenerMock).toHaveBeenCalledWith(event)

    // Since the theme is forced, the storage event should not be handled
    expect(screen.getByTestId('theme').textContent).toBe('forced')
    expect(screen.getByTestId('resolvedTheme').textContent).toBe('light')
  })

  test('should update theme if forcedTheme is unset and a storage event was dispatched while theme was forced', () => {
    localStorageMock['theme'] = 'system'
    let wrapper: RenderResult

    act(() => {
      wrapper = render(
        <ThemeProvider forcedTheme="light">
          <HelperComponent />
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId('theme').textContent).toBe('forced')
    expect(screen.getByTestId('resolvedTheme').textContent).toBe('light')

    const event = makeStorageEvent('theme', 'dark', 'system')

    act(() => {
      window.dispatchEvent(event)
    })

    expect(storageEventListenerMock).toHaveBeenCalledWith(event)
    // Since forceTheme is set, the storage event should be ignored
    expect(screen.getByTestId('theme').textContent).toBe('forced')
    expect(screen.getByTestId('resolvedTheme').textContent).toBe('light')

    act(() => {
      wrapper.rerender(
        <ThemeProvider>
          <HelperComponent />
        </ThemeProvider>
      )
    })

    waitFor(() => {
      // Since forceTheme is unset, we should update the theme
      // to the value of the previous storage event
      expect(screen.getByTestId('theme').textContent).toBe('dark')
      expect(screen.getByTestId('resolvedTheme').textContent).toBe('dark')
    })
  })

  test('should be able to set forceTheme at a later point in time', () => {
    localStorageMock['theme'] = 'light'
    let wrapper: RenderResult

    act(() => {
      wrapper = render(
        <ThemeProvider>
          <HelperComponent />
        </ThemeProvider>
      )
    })

    expect(screen.getByTestId('theme').textContent).toBe('light')
    expect(screen.getByTestId('resolvedTheme').textContent).toBe('light')

    act(() => {
      wrapper.rerender(
        <ThemeProvider forcedTheme="dark">
          <HelperComponent />
        </ThemeProvider>
      )
    })

    waitFor(() => {
      expect(screen.getByTestId('theme').textContent).toBe('forced')
      expect(screen.getByTestId('resolvedTheme').textContent).toBe('dark')
    })
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
