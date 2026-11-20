import { test, expect, mount } from '../support/webui.mjs';

test.describe('in the site footer on a phone', () => {
    // The footer is the same on every page, so a light page keeps the test quick on a busy machine.
    test.use({ startUrl: '/about' });
    for (const width of [320, 360, 375]) {
        test(`at ${width}px, all of it stays on screen`, async ({ page }) => {
            await page.setViewportSize({ width, height: 700 });
            const el = page.locator('webui-app footer webui-poweredby');
            await expect(el).toContainText('Web UI');
            await expect(el.getByText('Powered by')).toBeInViewport({ ratio: 1 });
            await expect(el.locator('a')).toBeInViewport({ ratio: 1 });
        });
    }
});
