// @vitest-environment jsdom

import * as React from 'react'
import { act, render, renderHook, screen } from '@testing-library/react'
import { vi, beforeAll, beforeEach, afterEach, afterAll, describe, test, it, expect } from 'vitest'
import { cleanup } from '@testing-library/react'

import { ThemeProvider, useTheme } from '../src/index'
import { ThemeProviderProps } from '../src/types'
import { setDeviceTheme } from './mocks/device-theme'
import { makeBrowserStorageMock } from './mocks/storage'
import { getCookieStorage } from '../src/cookie-storage'

let originalLocalStorage: Storage
let originalSessionStorage: Storage

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

beforeAll(() => {
  // Create mocks of localStorage getItem and setItem functions
  originalLocalStorage = window.localStorage

  // Create mocks of sessionStorage getItem and setItem functions
  originalSessionStorage = window.sessionStorage
})

beforeEach(() => {
  // Reset window side-effects
  setDeviceTheme('light')
  document.documentElement.style.colorScheme = ''
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('class')

  // Clear storage-mocks
  window.sessionStorage = makeBrowserStorageMock()
  window.localStorage = makeBrowserStorageMock()
})

afterEach(() => {
  cleanup()
})

afterAll(() => {
  window.localStorage = originalLocalStorage
  window.sessionStorage = originalSessionStorage
})

function makeWrapper(props: ThemeProviderProps) {
  return ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider {...props}>{children}</ThemeProvider>
  )
}

describe('defaultTheme', () => {
  test('should return system-theme when no default-theme is set', () => {
    setDeviceTheme('light')

    const { result } = renderHook(() => useTheme(), {
      wrapper: makeWrapper({})
    })
    expect(result.current.theme).toBe('system')
    expect(result.current.systemTheme).toBe('light')
    expect(result.current.resolvedTheme).toBe('light')
  })

  test('should return light when no default-theme is set and enableSystem=false', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: makeWrapper({ enableSystem: false })
    })

    expect(result.current.theme).toBe('light')
    expect(result.current.resolvedTheme).toBe('light')
  })

  test('should return light when light is set as default-theme', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: makeWrapper({ defaultTheme: 'light' })
    })

    expect(result.current.theme).toBe('light')
    expect(result.current.resolvedTheme).toBe('light')
  })

  test('should return dark when dark is set as default-theme', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: makeWrapper({ defaultTheme: 'dark' })
    })
    expect(result.current.theme).toBe('dark')
    expect(result.current.resolvedTheme).toBe('dark')
  })
})

describe('provider', () => {
  it('ignores nested ThemeProviders', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultTheme="dark">
          <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
        </ThemeProvider>
      )
    })

    expect(result.current.theme).toBe('dark')
    expect(result.current.resolvedTheme).toBe('dark')
  })
})

describe('storage', () => {
  // check default storage
  test('Storage[default]: should use localStorage by default', () => {
    const { result } = renderHook(() => useTheme(), {
      // 'storage' prop is not set
      wrapper: makeWrapper({})
    })
    result.current.setTheme('dark')

    expect(window.localStorage.setItem).toBeCalledTimes(1)
    expect(window.localStorage.getItem('theme')).toBe('dark')
  })

  const storageTypes: {
    name: string
    storagePropValue: ThemeProviderProps['storage']
    // Callback to allow retrieval of the storages inside the test-functions
    getStorage: () => Storage
  }[] = [
    {
      name: 'localStorage',
      storagePropValue: 'localStorage',
      getStorage: () => window.localStorage
    },
    {
      name: 'sessionStorage',
      storagePropValue: 'sessionStorage',
      getStorage: () => window.sessionStorage
    }
  ]

  storageTypes.forEach(({ name, storagePropValue, getStorage }) => {
    const getTestName = (test: string) => `Storage[${name}]: ${test}`

    test(getTestName('should not set default value in storage'), () => {
      renderHook(() => useTheme(), {
        wrapper: makeWrapper({ defaultTheme: 'dark', storage: storagePropValue })
      })

      const storage = getStorage()
      expect(storage.setItem).toBeCalledTimes(0)
      expect(storage.getItem).toHaveBeenCalledTimes(2)
      expect(storage.getItem).toHaveBeenCalledWith('theme')
      expect(storage.getItem('theme')).toBeNull()
    })

    test(getTestName('should set theme in storage when switching themes'), () => {
      const { result, rerender } = renderHook(() => useTheme(), {
        wrapper: makeWrapper({ storage: storagePropValue })
      })

      result.current.setTheme('dark')
      rerender()

      const storage = getStorage()
      expect(storage.setItem).toHaveBeenCalledOnce()
      expect(storage.getItem).toHaveBeenCalledTimes(2)
      expect(storage.getItem).toHaveBeenCalledWith('theme')
      expect(storage.setItem).toHaveBeenCalledWith('theme', 'dark')
      expect(result.current.theme).toBe('dark')
      expect(storage.getItem('theme')).toBe('dark')
    })

    test(getTestName('should set theme in storage with defined storageKey'), () => {
      const themeKey = 'customKey'
      const { result, rerender } = renderHook(() => useTheme(), {
        wrapper: makeWrapper({ storage: storagePropValue, storageKey: themeKey })
      })

      result.current.setTheme('dark')
      rerender()

      const storage = getStorage()
      expect(storage.setItem).toHaveBeenCalledOnce()
      expect(storage.getItem).toHaveBeenCalledTimes(2)
      expect(storage.getItem).toHaveBeenCalledWith(themeKey)
      expect(storage.setItem).toHaveBeenCalledWith(themeKey, 'dark')
      expect(result.current.theme).toBe('dark')
      expect(storage.getItem(themeKey)).toBe('dark')
    })
  })

  test(`Storage=[cookie]: should not set default value in storage`, () => {
    renderHook(() => useTheme(), {
      wrapper: makeWrapper({ defaultTheme: 'dark', storage: 'cookie' })
    })

    const cookieStorage = getCookieStorage()
    // expect cookie 'theme' to not be set
    expect(cookieStorage.getItem('theme')).toBeNull()
  })

  test(`Storage=[cookie]: should set theme in storage when switching themes`, () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: makeWrapper({ storage: 'cookie' })
    })
    result.current.setTheme('dark')

    const cookieStorage = getCookieStorage()
    expect(cookieStorage.getItem('theme')).toBe('dark')
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

  test('supports multiple attributes', () => {
    act(() => {
      render(
        <ThemeProvider attribute={['data-example', 'data-theme-test']}>
          <HelperComponent forceSetTheme="light" />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.getAttribute('data-example')).toBe('light')
    expect(document.documentElement.getAttribute('data-theme-test')).toBe('light')
  })
})

describe('custom value-mapping', () => {
  test('should use custom value mapping when using value={{pink:"my-pink-theme"}}', () => {
    window.localStorage.setItem('theme', 'pink')

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

  test('supports multiple attributes', () => {
    act(() => {
      render(
        <ThemeProvider
          attribute={['data-example', 'data-theme-test']}
          themes={['pink', 'light', 'dark', 'system']}
          value={{ pink: 'my-pink-theme' }}
        >
          <HelperComponent forceSetTheme="pink" />
        </ThemeProvider>
      )
    })

    expect(document.documentElement.getAttribute('data-example')).toBe('my-pink-theme')
    expect(document.documentElement.getAttribute('data-theme-test')).toBe('my-pink-theme')
  })
})

describe('forcedTheme', () => {
  test('should render saved theme when no forcedTheme is set', () => {
    window.localStorage.setItem('theme', 'dark')

    const { result } = renderHook(() => useTheme(), {
      wrapper: makeWrapper({})
    })

    expect(result.current.theme).toBe('dark')
    expect(result.current.forcedTheme).toBeUndefined()
  })

  test('should render light theme when forcedTheme is set to light', () => {
    window.localStorage.setItem('theme', 'dark')

    const { result } = renderHook(() => useTheme(), {
      wrapper: makeWrapper({
        forcedTheme: 'light'
      })
    })

    expect(result.current.theme).toBe('dark')
    expect(result.current.forcedTheme).toBe('light')
  })
})

describe('system theme', () => {
  test('resolved theme should be set', () => {
    setDeviceTheme('dark')

    const { result } = renderHook(() => useTheme(), {
      wrapper: makeWrapper({})
    })

    expect(result.current.theme).toBe('system')
    expect(result.current.systemTheme).toBe('dark')
    expect(result.current.resolvedTheme).toBe('dark')
    expect(result.current.forcedTheme).toBeUndefined()
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

    const { result } = renderHook(() => useTheme(), {
      wrapper: makeWrapper({ enableSystem: false, defaultTheme: 'light' })
    })

    expect(result.current.theme).toBe('light')
    expect(result.current.systemTheme).toBeUndefined()
    expect(result.current.resolvedTheme).toBe('light')
    expect(result.current.forcedTheme).toBeUndefined()
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

describe('setTheme', () => {
  test('setTheme(<literal>)', () => {
    const { result, rerender } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
    })
    expect(result.current?.setTheme).toBeDefined()
    expect(result.current.resolvedTheme).toBe('light')
    result.current.setTheme('dark')
    rerender()
    expect(result.current.resolvedTheme).toBe('dark')
  })

  test('setTheme(<function>)', () => {
    const { result, rerender } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
    })
    expect(result.current?.setTheme).toBeDefined()
    expect(result.current.theme).toBe('light')
    expect(result.current.resolvedTheme).toBe('light')

    const toggleTheme = vi.fn((theme: string) => (theme === 'light' ? 'dark' : 'light'))

    result.current.setTheme(toggleTheme)
    expect(toggleTheme).toBeCalledTimes(1)
    rerender()

    expect(result.current.theme).toBe('dark')
    expect(result.current.resolvedTheme).toBe('dark')

    result.current.setTheme(toggleTheme)
    expect(toggleTheme).toBeCalledTimes(2)
    rerender()

    expect(result.current.theme).toBe('light')
    expect(result.current.resolvedTheme).toBe('light')
  })
})

describe('inline script', () => {
  test('should pass props to script', () => {
    act(() => {
      render(
        <ThemeProvider defaultTheme="light" scriptProps={{ 'data-test': '1234' }}>
          <HelperComponent />
        </ThemeProvider>
      )
    })

    expect(document.querySelector('script[data-test="1234"]')).toBeTruthy()
  })
})
