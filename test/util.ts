import { Page, expect, Browser } from '@playwright/test'

export async function checkAppliedTheme(page: Page, theme: string) {
  expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe(theme)
  expect(await page.evaluate(() => document.documentElement.getAttribute('style'))).toBe(
    `color-scheme: ${theme};`
  )
}

export async function checkAppliedContrast(page: Page, contrast: string) {
  expect(await page.evaluate(() => document.documentElement.getAttribute('data-contrast'))).toBe(contrast)
}

export async function checkStoredTheme(page: Page, expectedTheme: string) {
  const localStorage = await page.evaluate(() => window.localStorage)
  expect(localStorage?.theme).toBe(expectedTheme)
}

export async function checkStoredContrast(page: Page, expectedContrast: string) {
  const localStorage = await page.evaluate(() => window.localStorage)
  expect(localStorage?.contrast).toBe(expectedContrast)
}

type MakeBrowserContextOptions = {
  baseURL?: string
  contrast?: 'no-preference' | 'more'
  colorScheme?: 'light' | 'dark' | 'no-preference'
  localStorage?: { name: string; value: string }[]
}

export async function makeBrowserContext(browser: Browser, options: MakeBrowserContextOptions) {
  return await browser.newContext({
    contrast: options.contrast ?? 'no-preference',
    colorScheme: options.colorScheme ?? 'no-preference',
    storageState: {
      cookies: [],
      origins: [
        {
          origin: options.baseURL ?? 'http://localhost:3000',
          localStorage: options.localStorage ?? []
        }
      ]
    }
  })
}
