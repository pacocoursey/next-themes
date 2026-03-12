import { test, expect } from '@playwright/test'
import { checkAppliedTheme, checkStoredTheme, makeBrowserContext } from './util'

test.describe('forced theme test-suite', async () => {
  function makeForcedThemeTest(pageUrl: string, storedTheme: string, expectedTheme: string) {
    test(`should render forced-theme (${expectedTheme}) instead of stored theme (${expectedTheme})`, async ({
      browser,
      baseURL
    }) => {
      const context = await makeBrowserContext(browser, {
        baseURL,
        localStorage: [{ name: 'theme', value: storedTheme }]
      })
      const page = await context.newPage()
      await page.goto(pageUrl)

      await checkStoredTheme(page, storedTheme)
      await checkAppliedTheme(page, expectedTheme)
    })
  }

  makeForcedThemeTest('/light', 'dark', 'light')
  makeForcedThemeTest('/dark', 'light', 'dark')

  function makeResolvedThemeTest(pageUrl: string, storedTheme: string, expectedResolvedTheme: string) {
    test(`resolvedTheme should be "${expectedResolvedTheme}" on ${pageUrl} when stored theme is "${storedTheme}"`, async ({
      browser,
      baseURL
    }) => {
      const context = await makeBrowserContext(browser, {
        baseURL,
        localStorage: [{ name: 'theme', value: storedTheme }]
      })
      const page = await context.newPage()
      await page.goto(pageUrl)

      // resolvedTheme from useTheme() should reflect the forced theme,
      // not the user's stored preference
      const resolvedTheme = await page.locator('[data-testid="resolved-theme"]').textContent()
      expect(resolvedTheme).toBe(expectedResolvedTheme)
    })
  }

  // resolvedTheme in context must match the forcedTheme, not the stored preference
  makeResolvedThemeTest('/light', 'dark', 'light')
  makeResolvedThemeTest('/dark', 'light', 'dark')
})
