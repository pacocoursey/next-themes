import { test} from '@playwright/test';
import { checkAppliedTheme } from './util';

test.describe('theme switch test-suite', () => {

    test('should switch to dark-theme', async ({ page }) => {
        await page.goto('/');
        // Select dark
        await page.locator('[data-test-id="theme-selector"]').selectOption('dark');
        // Check if dark theme is applied
        await checkAppliedTheme(page, 'dark');
    });

    test('should switch to light-theme', async ({ page }) => {
        await page.goto('/');
        // Select dark
        await page.locator('[data-test-id="theme-selector"]').selectOption('light');
        // Check if dark theme is applied
        await checkAppliedTheme(page, 'light');
    });
})