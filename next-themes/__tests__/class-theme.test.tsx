// @vitest-environment jsdom

import * as React from 'react'
import { act, cleanup, render, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { ThemeProvider, ThemeScript, useTheme } from '../src/index'
import type { ThemeProviderProps } from '../src/types'

const root = document.documentElement
const observers: MutationObserver[] = []
let dark = false
let listeners: Set<(event: MediaQueryListEvent) => void>

beforeEach(() => {
  localStorage.clear()
  root.removeAttribute('class')
  root.removeAttribute('data-theme')
  root.removeAttribute('style')
  dark = false
  listeners = new Set()
  vi.stubGlobal('matchMedia', () => ({
    matches: dark,
    addListener: (listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
    removeListener: (listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener)
  }))
})

afterEach(() => {
  cleanup()
  observers.forEach(observer => observer.disconnect())
  observers.length = 0
  vi.unstubAllGlobals()
})

function observeClasses() {
  const observer = new MutationObserver(() => {})
  observer.observe(root, { attributes: true, attributeFilter: ['class'], attributeOldValue: true })
  observers.push(observer)
  return () => observer.takeRecords()
}

function setSystemTheme(theme: 'light' | 'dark') {
  dark = theme === 'dark'
  act(() => {
    // Listeners can be replaced by React effects while handling the event.
    Array.from(listeners).forEach(listener => listener({ matches: dark } as MediaQueryListEvent))
  })
}

function mountProvider(props: ThemeProviderProps = {}) {
  return renderHook(() => useTheme(), {
    wrapper: ({ children }) => (
      <ThemeProvider attribute="class" {...props}>
        {children}
      </ThemeProvider>
    )
  })
}

// Execute the actual serialized bootstrap script, as the browser does before hydration.
function runScript(props: ThemeProviderProps = {}) {
  const { container, unmount } = render(
    <ThemeScript
      attribute="class"
      storageKey="theme"
      defaultTheme="system"
      themes={['light', 'dark']}
      enableSystem
      enableColorScheme
      {...props}
    />
  )
  const source = container.querySelector('script')!.textContent!
  unmount()
  window.eval(source)
}

describe('class theme mutations', () => {
  test.each(['light', 'dark', 'system'])('preserves the bootstrap class for stored %s', theme => {
    localStorage.setItem('theme', theme)
    root.className = 'font-sans'
    runScript()
    const classes = root.className
    const mutations = observeClasses()

    const { result } = mountProvider()

    expect(root.className).toBe(classes)
    expect(mutations()).toEqual([])
    expect(result.current.theme).toBe(theme)
    expect(root.style.colorScheme).toBe(theme === 'system' ? 'light' : theme)
  })

  test('preserves an already-applied class in the bootstrap script', () => {
    root.className = 'font-sans light'
    const mutations = observeClasses()
    runScript()
    runScript()
    expect(root.className).toBe('font-sans light')
    expect(mutations()).toEqual([])
  })

  test('preserves the class during StrictMode effect replay', () => {
    root.className = 'font-sans light'
    const mutations = observeClasses()
    render(
      <React.StrictMode>
        <ThemeProvider attribute="class" />
      </React.StrictMode>
    )
    expect(mutations()).toEqual([])
    expect(root.className).toBe('font-sans light')
  })

  test.each(['provider', 'script'])(
    '%s removes stale theme classes and keeps unrelated classes',
    path => {
      root.className = 'font-sans light dark pink'
      const props = { themes: ['light', 'dark', 'pink'] }
      if (path === 'provider') mountProvider(props)
      else runScript(props)

      expect(Array.from(root.classList).sort()).toEqual(['font-sans', 'light'])
    }
  )

  test('applies explicit and system transitions, including a return to a previously used theme', () => {
    const { result } = mountProvider()
    const mutations = observeClasses()

    setSystemTheme('light')
    expect(mutations()).toEqual([])
    setSystemTheme('dark')
    expect(root.className).toBe('dark')
    expect(result.current.resolvedTheme).toBe('dark')
    expect(root.style.colorScheme).toBe('dark')
    mutations()

    act(() => result.current.setTheme('dark'))
    expect(mutations()).toEqual([])
    expect(localStorage.getItem('theme')).toBe('dark')
    setSystemTheme('light')
    expect(root.className).toBe('dark')
    act(() => result.current.setTheme('light'))
    expect(root.className).toBe('light')
    act(() => result.current.setTheme('system'))
    setSystemTheme('dark')
    expect(root.className).toBe('dark')
    setSystemTheme('light')
    expect(root.className).toBe('light')
    expect(root.style.colorScheme).toBe('light')
  })

  test('checks the current DOM when another writer changes the classes', () => {
    mountProvider()
    root.className = 'font-sans dark'
    setSystemTheme('light')
    expect(Array.from(root.classList).sort()).toEqual(['font-sans', 'light'])
    root.classList.add('dark')
    setSystemTheme('light')
    expect(Array.from(root.classList).sort()).toEqual(['font-sans', 'light'])
  })

  test('still updates other attributes and color-scheme when the class is already correct', () => {
    root.className = 'light'
    root.dataset.theme = 'dark'
    root.style.colorScheme = 'dark'
    const mutations = observeClasses()
    mountProvider({ attribute: ['class', 'data-theme'] })
    expect(mutations()).toEqual([])
    expect(root.dataset.theme).toBe('light')
    expect(root.style.colorScheme).toBe('light')
  })
})

describe('class theme compatibility', () => {
  test('uses mapped values for bootstrap, hydration and subsequent switches', () => {
    const props = { value: { light: 'light-theme', dark: 'dark-theme' } }
    runScript(props)
    const mutations = observeClasses()
    const { result } = mountProvider(props)
    expect(root.className).toBe('light-theme')
    expect(mutations()).toEqual([])
    act(() => result.current.setTheme('dark'))
    expect(root.className).toBe('dark-theme')
    expect(root.style.colorScheme).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  test('updates color-scheme without changing classes when theme values share a mapping', () => {
    const { result } = mountProvider({ value: { light: 'shared', dark: 'shared' } })
    const mutations = observeClasses()
    act(() => result.current.setTheme('dark'))
    expect(root.className).toBe('shared')
    expect(root.style.colorScheme).toBe('dark')
    expect(mutations()).toEqual([])
  })

  test('removes a previous mapped class when the new theme has no mapped value', () => {
    const { result } = mountProvider({ defaultTheme: 'dark', value: { dark: 'dark-theme' } })
    expect(root.className).toBe('dark-theme')
    act(() => result.current.setTheme('light'))
    expect(root.className).toBe('')
  })

  test('supports custom themes and cleans up stale mapped classes', () => {
    const props = {
      themes: ['pink', 'blue'],
      defaultTheme: 'pink',
      value: { pink: 'pink-theme', blue: 'blue-theme' }
    }
    root.className = 'font-sans pink-theme blue-theme'
    const { result } = mountProvider(props)
    expect(Array.from(root.classList).sort()).toEqual(['font-sans', 'pink-theme'])
    act(() => result.current.setTheme('blue'))
    expect(Array.from(root.classList).sort()).toEqual(['blue-theme', 'font-sans'])
  })

  test('preserves forced themes and restores the stored preference when the force is removed', () => {
    localStorage.setItem('theme', 'light')
    runScript({ forcedTheme: 'dark' })
    const mutations = observeClasses()
    const { rerender } = render(<ThemeProvider attribute="class" forcedTheme="dark" />)
    expect(mutations()).toEqual([])
    setSystemTheme('light')
    expect(root.className).toBe('dark')
    rerender(<ThemeProvider attribute="class" forcedTheme="light" />)
    expect(root.className).toBe('light')
    rerender(<ThemeProvider attribute="class" forcedTheme="dark" />)
    expect(root.className).toBe('dark')
    rerender(<ThemeProvider attribute="class" />)
    expect(root.className).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
  })

  test('ignores nested providers and leaves an identical sibling provider class untouched', () => {
    root.className = 'light'
    const mutations = observeClasses()
    render(
      <>
        <ThemeProvider attribute="class">
          <ThemeProvider attribute="class" forcedTheme="dark" />
        </ThemeProvider>
        <ThemeProvider attribute="class" />
      </>
    )
    expect(mutations()).toEqual([])
    expect(root.className).toBe('light')
    setSystemTheme('dark')
    expect(root.className).toBe('dark')
  })

  test('allows independent providers to reapply their theme after another provider changes it', () => {
    const first = mountProvider({ defaultTheme: 'light' })
    const second = mountProvider({ defaultTheme: 'dark' })
    expect(root.className).toBe('dark')
    act(() => first.result.current.setTheme('system'))
    expect(root.className).toBe('light')
    act(() => second.result.current.setTheme('light'))
    act(() => second.result.current.setTheme('dark'))
    expect(root.className).toBe('dark')
  })

  test('applies cross-tab storage events without rewriting storage and honors the storage key', () => {
    const { result } = mountProvider({ storageKey: 'custom-theme' })
    const mutations = observeClasses()
    const update = (key: string, newValue: string | null) => {
      act(() => window.dispatchEvent(new StorageEvent('storage', { key, newValue })))
    }

    update('custom-theme', 'light')
    expect(result.current.theme).toBe('light')
    expect(mutations()).toEqual([])
    update('other-key', 'dark')
    expect(root.className).toBe('light')
    update('custom-theme', 'dark')
    expect(result.current.theme).toBe('dark')
    expect(root.className).toBe('dark')
    expect(root.style.colorScheme).toBe('dark')
    expect(localStorage.getItem('custom-theme')).toBeNull()
    update('custom-theme', null)
    expect(result.current.theme).toBe('system')
    expect(root.className).toBe('light')
  })
})
