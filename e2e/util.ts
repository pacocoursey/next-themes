import { Page, expect } from "@playwright/test";

export async function checkAppliedTheme(page: Page,theme: string) {
    expect(
        await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    ).toBe(theme);
    expect(
        await page.evaluate(() => document.documentElement.getAttribute('style'))
    ).toBe(`color-scheme: ${theme};`);
}
