import { test} from '@playwright/test';
import { checkAppliedTheme, makeBrowserContext } from './util';

test.describe('basic theming test-suite', () => {

    function makeRenderThemeTest(theme: string) {
        test(`should render ${theme} theme`, async ({ browser, baseURL }) => {
            const context = await  makeBrowserContext(browser, { 
                baseURL, 
                localStorage: [{ name: 'theme', value: theme }] 
            });
            const page = await context.newPage()

            await page.goto('/');
            // Select dark
            await page.locator('[data-test-id="theme-selector"]').selectOption(theme);
            // Check if dark theme is applied
            await checkAppliedTheme(page, theme);
        });
    }

    makeRenderThemeTest('light');
    makeRenderThemeTest('dark');

    function shouldUpdateTheme(initialTheme, targetTheme: string) {
        test(`should switch from ${initialTheme} to ${targetTheme}-theme`, async ({ browser, baseURL }) => {
                const context = await  makeBrowserContext(browser, { 
                    baseURL, 
                    localStorage: [{ name: 'theme', value: initialTheme }] 
                });
                const page = await context.newPage()

                await page.goto('/');
                await checkAppliedTheme(page, initialTheme);
                // Select dark
                await page.locator('[data-test-id="theme-selector"]').selectOption(targetTheme);
                // Check if dark theme is applied
                await checkAppliedTheme(page, targetTheme);
            });
        }

    shouldUpdateTheme('light', 'dark');
    shouldUpdateTheme('dark', 'light');
})