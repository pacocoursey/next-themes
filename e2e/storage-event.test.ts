import { test, expect } from '@playwright/test'
import { checkAppliedTheme, makeBrowserContext } from './util'

test.describe('storage-events test-suite', async () => {
  test('should switch theme if stored theme value is updated in a different tab', async ({ browser, baseURL }) => {
    const context = await makeBrowserContext(browser, {
      colorScheme: 'light',
      baseURL: baseURL,
      localStorage: [
        { name: 'theme', value: 'light'}
      ]
    })
    // Create page and see if stored theme is applied
    const page1 = await context.newPage()
    await page1.goto('/')
    await checkAppliedTheme(page1, 'light');

    // Create second page and also check theme value
    const page2 = await context.newPage()
    await page2.goto('/')
    await checkAppliedTheme(page2, 'light')

    // Select theme in page2
    await page2.locator('[data-test-id="theme-selector"]').selectOption('dark');
    // Expect both pages to have changed theme
    await checkAppliedTheme(page2,'dark')
    await checkAppliedTheme(page1, 'dark')

  })

  test('should apply ignored storage-event once page with forced-theme is left', async ({ browser, baseURL }) => {
    const context = await makeBrowserContext(browser, {
      colorScheme: 'light',
      baseURL: baseURL,
      localStorage: [
        { name: 'theme', value: 'dark'}
      ]
    })

    // Create page and see if stored theme is applied
    const page1 = await context.newPage()
    await page1.goto('/')
    await checkAppliedTheme(page1, 'dark');

    // Create second page and also check theme value
    const page2 = await context.newPage()
    await page2.goto('/dark')
    await checkAppliedTheme(page2, 'dark')

    // Change theme on page1 and assert theme change
    await page1.locator('[data-test-id="theme-selector"]').selectOption('light');
    await checkAppliedTheme(page1,'light')

    // Page 2 should not have changed theme since on page with forced theme
    await checkAppliedTheme(page2, 'dark')
    const localStorage = await page2.evaluate(() => window.localStorage)
    expect(localStorage?.theme).toBe('light')

    // Navigate to home and check if newly stored theme is now applied
    await page2.locator("text=Go back home").click()
    await page2.locator('[data-test-id="theme-selector"]').waitFor()
    expect(page2.url()).toBe(baseURL + '/')
    await checkAppliedTheme(page2, 'light')
  })
})