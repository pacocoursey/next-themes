// @vitest-environment jsdom

import * as React from 'react'
import { act, render, renderHook } from '@testing-library/react'
import { vi, beforeAll, beforeEach, afterEach, afterAll, describe, test, it, expect } from 'vitest'
import { cleanup } from '@testing-library/react'

import { ContrastProvider, useContrast } from '../src/index'
import { ContrastProviderProps } from '../src/types'

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

// HelperComponent to render the contrast inside a paragraph-tag and setting a contrast via the forceSetContrast prop
const HelperComponent = ({ forceSetContrast }: { forceSetContrast?: 'less' | 'more' }) => {
  const { setContrast, contrast, forcedContrast } = useContrast()

  React.useEffect(() => {
    if (forceSetContrast) {
      setContrast(forceSetContrast)
    }
  }, [forceSetContrast])

  return (
    <>
      <p data-testid="contrast">{contrast}</p>
      <p data-testid="forcedContrast">{forcedContrast}</p>
    </>
  )
}

function setDeviceContrast(contrast: 'more' | 'no-preference') {
  // Create a mock of the window.matchMedia function
  // Based on: https://stackoverflow.com/questions/39830580/jest-test-fails-typeerror-window-matchmedia-is-not-a-function
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: contrast === 'more',
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
  setDeviceContrast('no-preference')
  document.documentElement.style.colorScheme = ''
  document.documentElement.removeAttribute('data-contrast')
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

function makeWrapper(props: ContrastProviderProps) {
  return ({ children }: { children: React.ReactNode }) => (
    <ContrastProvider {...props}>{children}</ContrastProvider>
  )
}

describe('defaultContrast', () => {
  test('should return no-preference contrast on device contrast', () => {
    setDeviceContrast('no-preference')

    const { result } = renderHook(() => useContrast(), {
      wrapper: makeWrapper({})
    })
    expect(result.current.contrast).toBe('no-preference')
  })

  test('should return more when more is set as default-contrast', () => {
    const { result } = renderHook(() => useContrast(), {
      wrapper: makeWrapper({ defaultContrast: 'more' })
    })
    expect(result.current.contrast).toBe('more')
  })
})

describe('provider', () => {
  it('ignores nested ContrastProviders', () => {
    const { result } = renderHook(() => useContrast(), {
      wrapper: ({ children }) => (
        <ContrastProvider defaultContrast="more">
          <ContrastProvider defaultContrast="less">{children}</ContrastProvider>
        </ContrastProvider>
      )
    })

    expect(result.current.contrast).toBe('more')
  })
})

describe('storage', () => {
  test('should not set localStorage with default value', () => {
    renderHook(() => useContrast(), {
      wrapper: makeWrapper({ defaultContrast: 'more' })
    })

    expect(window.localStorage.setItem).toBeCalledTimes(0)
    expect(window.localStorage.getItem('contrast')).toBeNull()
  })

  test('should set localStorage when switching contrasts', () => {
    const { result } = renderHook(() => useContrast(), {
      wrapper: makeWrapper({})
    })
    result.current.setContrast('more')

    expect(window.localStorage.setItem).toBeCalledTimes(1)
    expect(window.localStorage.getItem('contrast')).toBe('more')
  })
})

describe('custom storageKey', () => {
  test("should save to localStorage with 'contrast' key when using default settings", () => {
    act(() => {
      render(
        <ContrastProvider>
          <HelperComponent forceSetContrast="less" />
        </ContrastProvider>
      )
    })

    expect(window.localStorage.getItem).toHaveBeenCalledWith('contrast')
    expect(window.localStorage.setItem).toHaveBeenCalledWith('contrast', 'less')
  })

  test("should save to localStorage with 'custom' when setting prop 'storageKey' to 'customKey'", () => {
    act(() => {
      render(
        <ContrastProvider storageKey="customKey">
          <HelperComponent forceSetContrast="less" />
        </ContrastProvider>
      )
    })

    expect(window.localStorage.getItem).toHaveBeenCalledWith('customKey')
    expect(window.localStorage.setItem).toHaveBeenCalledWith('customKey', 'less')
  })
})

describe('custom attribute', () => {
  test('should use data-contrast attribute when using default', () => {
    act(() => {
      render(
        <ContrastProvider>
          <HelperComponent forceSetContrast="less" />
        </ContrastProvider>
      )
    })

    expect(document.documentElement.getAttribute('data-contrast')).toBe('less')
  })

  test('should use class attribute (CSS-class) when attribute="class"', () => {
    act(() => {
      render(
        <ContrastProvider attribute="class">
          <HelperComponent forceSetContrast="less" />
        </ContrastProvider>
      )
    })

    expect(document.documentElement.classList.contains('less-contrast')).toBeTruthy()
  })

  test('should use "data-example"-attribute when attribute="data-example"', () => {
    act(() => {
      render(
        <ContrastProvider attribute="data-example">
          <HelperComponent forceSetContrast="less" />
        </ContrastProvider>
      )
    })

    expect(document.documentElement.getAttribute('data-example')).toBe('less')
  })

  test('supports multiple attributes', () => {
    act(() => {
      render(
        <ContrastProvider attribute={['data-example', 'data-contrast-test']}>
          <HelperComponent forceSetContrast="less" />
        </ContrastProvider>
      )
    })

    expect(document.documentElement.getAttribute('data-example')).toBe('less')
    expect(document.documentElement.getAttribute('data-contrast-test')).toBe('less')
  })
})

describe('custom value-mapping', () => {
  test('should use custom value mapping when using value={{pink:"my-less-contrast"}}', () => {
    localStorageMock.setItem('contrast', 'less')

    act(() => {
      render(
        <ContrastProvider
          value={{ less: 'my-less-contrast' }}
        >
          <HelperComponent forceSetContrast="less" />
        </ContrastProvider>
      )
    })

    expect(document.documentElement.getAttribute('data-contrast')).toBe('my-less-contrast')
    expect(window.localStorage.setItem).toHaveBeenCalledWith('contrast', 'less')
  })

  test('should allow missing values (attribute)', () => {
    act(() => {
      render(
        <ContrastProvider value={{ more: 'contrast-mode' }}>
          <HelperComponent forceSetContrast="less" />
        </ContrastProvider>
      )
    })

    expect(document.documentElement.hasAttribute('data-contrast')).toBeFalsy()
  })

  test('should allow missing values (class)', () => {
    act(() => {
      render(
        <ContrastProvider attribute="class" value={{ more: 'contrast-mode' }}>
          <HelperComponent forceSetContrast="less" />
        </ContrastProvider>
      )
    })

    expect(document.documentElement.classList.contains('less-contrast')).toBeFalsy()
  })

  test('supports multiple attributes', () => {
    act(() => {
      render(
        <ContrastProvider
          attribute={['data-example', 'data-contrast-test']}
          value={{ less: 'my-less-contrast' }}
        >
          <HelperComponent forceSetContrast="less" />
        </ContrastProvider>
      )
    })

    expect(document.documentElement.getAttribute('data-example')).toBe('my-less-contrast')
    expect(document.documentElement.getAttribute('data-contrast-test')).toBe('my-less-contrast')
  })
})

describe('forcedContrast', () => {
  test('should render saved contrast when no forcedContrast is set', () => {
    localStorageMock.setItem('contrast', 'more')

    const { result } = renderHook(() => useContrast(), {
      wrapper: makeWrapper({})
    })

    expect(result.current.contrast).toBe('more')
    expect(result.current.forcedContrast).toBeUndefined()
  })

  test('should render less contrast when forcedContrast is set to less', () => {
    localStorageMock.setItem('contrast', 'more')

    const { result } = renderHook(() => useContrast(), {
      wrapper: makeWrapper({
        forcedContrast: 'less'
      })
    })

    expect(result.current.contrast).toBe('more')
    expect(result.current.forcedContrast).toBe('less')
  })
})

describe('setContrast', () => {
  test('setContrast(<literal>)', () => {
    const { result, rerender } = renderHook(() => useContrast(), {
      wrapper: ({ children }) => <ContrastProvider defaultContrast="less">{children}</ContrastProvider>
    })
    expect(result.current?.setContrast).toBeDefined()
    result.current.setContrast('more')
    rerender()
  })

  test('setContrast(<function>)', () => {
    const { result, rerender } = renderHook(() => useContrast(), {
      wrapper: ({ children }) => <ContrastProvider defaultContrast="less">{children}</ContrastProvider>
    })
    expect(result.current?.setContrast).toBeDefined()
    expect(result.current.contrast).toBe('less')

    const toggleContrast = vi.fn((contrast: string) => (contrast === 'less' ? 'more' : 'less'))

    result.current.setContrast(toggleContrast)
    rerender()

    expect(toggleContrast).toBeCalledTimes(1)
    expect(result.current.contrast).toBe('more')

    result.current.setContrast(toggleContrast)
    rerender()

    expect(toggleContrast).toBeCalledTimes(2)
    expect(result.current.contrast).toBe('less')
  })

  test('setContrast(<function>) gets relevant state value', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { })

    const { result } = renderHook(() => useContrast(), {
      wrapper: ({ children }) => <ContrastProvider defaultContrast="less">{children}</ContrastProvider>
    })

    act(() => {
      result.current.setContrast((contrast) => {
        console.log('1', contrast)
        return contrast === 'more' ? 'less' : 'more'
      })
      result.current.setContrast((contrast) => {
        console.log('2', contrast)
        return contrast === 'less' ? 'more' : 'less'
      })
    })

    expect(consoleSpy).toHaveBeenCalledWith('1', 'less')
    expect(consoleSpy).toHaveBeenCalledWith('2', 'more')
    expect(result.current.contrast).toBe('less')

    consoleSpy.mockRestore()
  })

})

describe('inline script', () => {
  test('should pass props to script', () => {
    act(() => {
      render(
        <ContrastProvider defaultContrast="less" scriptProps={{ 'data-test': '1234' }}>
          <HelperComponent />
        </ContrastProvider>
      )
    })

    expect(document.querySelector('script[data-test="1234"]')).toBeTruthy()
  })
})
