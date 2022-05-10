import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator("h1")).toHaveText('next-themes Example');
});