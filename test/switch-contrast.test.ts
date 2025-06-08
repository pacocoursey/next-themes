import { test } from '@playwright/test'
import { checkAppliedContrast, makeBrowserContext } from './util'

test.describe('basic contrast test-suite', () => {
  function makeRenderContrastTest(contrast: string) {
    test(`should render ${contrast} contrast`, async ({ browser, baseURL }) => {
      const context = await makeBrowserContext(browser, {
        baseURL,
        localStorage: [{ name: 'contrast', value: contrast }]
      })
      const page = await context.newPage()

      await page.goto('/')
      // Select dark
      await page.locator('[data-test-id="contrast-selector"]').selectOption(contrast)
      // Check if dark contrast is applied
      await checkAppliedContrast(page, contrast)
    })
  }

  makeRenderContrastTest('more')
  makeRenderContrastTest('less')
  makeRenderContrastTest('no-preference')

  function shouldUpdateContrast(initialContrast, targetContrast: string) {
    test(`should switch from ${initialContrast} to ${targetContrast} contrast`, async ({
      browser,
      baseURL
    }) => {
      const context = await makeBrowserContext(browser, {
        baseURL,
        localStorage: [{ name: 'contrast', value: initialContrast }]
      })
      const page = await context.newPage()

      await page.goto('/')
      await checkAppliedContrast(page, initialContrast)
      // Select dark
      await page.locator('[data-test-id="contrast-selector"]').selectOption(targetContrast)
      // Check if dark theme is applied
      await checkAppliedContrast(page, targetContrast)
    })
  }

  shouldUpdateContrast('less', 'no-preference')
  shouldUpdateContrast('less', 'more')
  shouldUpdateContrast('no-preference', 'less')
  shouldUpdateContrast('no-preference', 'more')
  shouldUpdateContrast('more', 'less')
  shouldUpdateContrast('more', 'no-preference')
})
