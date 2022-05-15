import { test} from '@playwright/test'
import { checkAppliedTheme, checkStoredTheme, makeBrowserContext } from './util'

test.describe('forced theme test-suite', async () => {
  function makeForcedThemeTest(pageUrl: string, storedTheme: string, expectedTheme: string) {
    test(
      `should render forced-theme (${expectedTheme}) instead of stored theme (${expectedTheme})`, 
      async ({ browser, baseURL}) => {
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
})
