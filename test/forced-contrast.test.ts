import { test } from '@playwright/test'
import { checkAppliedContrast, checkStoredContrast, makeBrowserContext } from './util'

test.describe('forced contrast test-suite', async () => {
  function makeForcedContrastTest(pageUrl: string, storedContrast: string, expectedContrast: string) {
    test(`should render forced-contrast (${expectedContrast}) instead of stored contrast (${expectedContrast})`, async ({
      browser,
      baseURL
    }) => {
      const context = await makeBrowserContext(browser, {
        baseURL,
        localStorage: [{ name: 'contrast', value: storedContrast }]
      })
      const page = await context.newPage()
      await page.goto(pageUrl)

      await checkStoredContrast(page, storedContrast)
      await checkAppliedContrast(page, expectedContrast)
    })
  }

  makeForcedContrastTest('/contrast-more', 'less', 'more')
  makeForcedContrastTest('/contrast-less', 'more', 'less')
})
