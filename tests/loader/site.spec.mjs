import { test, expect } from '../support/webui.mjs';

// Loads real pages from the site, which exercises the framework the way visitors do.
for (const path of ['/', '/about', '/contact', '/privacy', '/terms', '/components', '/webui-methods']) {
    test.describe(`page ${path}`, () => {
        test.use({ startUrl: path });

        test('loads every component and has no uncaught errors', async ({ page }) => {
            await expect(page.locator('webui-app main')).not.toHaveClass(/transition/);
            await expect(page.locator('webui-nav-link').first()).toBeVisible();
            await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('*')]
                .map(el => el.localName)
                .filter(name => /^(webui|app)-/.test(name) && !customElements.get(name))), { timeout: 15000 }).toEqual([]);
        });
    });
}
