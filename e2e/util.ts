import { Page, expect, Browser } from '@playwright/test'

export async function checkAppliedTheme(page: Page,theme: string) {
    expect(
        await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    ).toBe(theme);
    expect(
        await page.evaluate(() => document.documentElement.getAttribute('style'))
    ).toBe(`color-scheme: ${theme};`);
}

type MakeBrowserContextOptions = {
    baseURL?: string,
    colorScheme?: 'light' | 'dark' | 'no-preference',
    localStorage?: {name: string, value: string}[]
}

export async function makeBrowserContext(browser: Browser, options: MakeBrowserContextOptions) {
    return await browser.newContext({
        colorScheme: options.colorScheme ?? 'no-preference',
        storageState: {
            cookies: [],
            origins: [
                {
                    origin: options.baseURL ?? 'http://localhost:3000',
                    localStorage: options.localStorage ?? [],
                }
            ]
        }
    })
}