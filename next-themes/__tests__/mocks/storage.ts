import { vi } from 'vitest'

export function makeBrowserStorageMock(initialState: Record<string, string> = {}): Storage {
  return (() => {
    let store: Record<string, string> = initialState

    return {
      name: 'MockStorage',
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
}
