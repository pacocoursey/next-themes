import { test, expect } from '@playwright/test'
import { makeBrowserContext } from './util'

test.describe('cache-components test-suite', () => {
  test('should keep theme consistent when navigating between locale routes', async ({
    browser,
    baseURL
  }) => {
    const context = await makeBrowserContext(browser, {
      baseURL,
      localStorage: [{ name: 'theme', value: 'light' }]
    })
    const page = await context.newPage()

    await page.goto('/en')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    // Switch to dark
    await page.getByRole('button', { name: /click to toggle/i }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    // Navigate to other locale
    await page.getByRole('link', { name: 'Español' }).click()
    await page.waitForURL('**/es')

    // Theme should still be dark
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    // Switch back to light on /es
    await page.getByRole('button', { name: /click to toggle/i }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    // Navigate back to /en
    await page.getByRole('link', { name: 'English' }).click()
    await page.waitForURL('**/en')

    // Theme should still be light (not stale dark from the hidden /en route)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })

  test('should persist theme across locale navigations with multiple round-trips', async ({
    browser,
    baseURL
  }) => {
    const context = await makeBrowserContext(browser, {
      baseURL,
      localStorage: [{ name: 'theme', value: 'dark' }]
    })
    const page = await context.newPage()

    await page.goto('/en')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    // Navigate back and forth several times
    await page.getByRole('link', { name: 'Español' }).click()
    await page.waitForURL('**/es')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    await page.getByRole('link', { name: 'English' }).click()
    await page.waitForURL('**/en')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    // Now toggle and navigate again
    await page.getByRole('button', { name: /click to toggle/i }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    await page.getByRole('link', { name: 'Español' }).click()
    await page.waitForURL('**/es')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })

  test('should sync localStorage when theme is toggled', async ({ browser, baseURL }) => {
    const context = await makeBrowserContext(browser, {
      baseURL,
      localStorage: [{ name: 'theme', value: 'light' }]
    })
    const page = await context.newPage()

    await page.goto('/en')
    await page.getByRole('button', { name: /click to toggle/i }).click()

    const stored = await page.evaluate(() => localStorage.getItem('theme'))
    expect(stored).toBe('dark')
  })
})
