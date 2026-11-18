import { test, expect, mount } from '../support/webui.mjs';

test('links to Web UI and reports its version', async ({ page }) => {
    const root = await mount(page, '<webui-poweredby></webui-poweredby>');
    const el = root.locator('webui-poweredby');
    await expect(el.locator('a')).toHaveAttribute('href', 'https://webui.stoicdreams.com');
    await expect(el).toHaveAttribute('version', /^\d+\.\d+\.\d+$/);
    const version = await el.getAttribute('version');
    await expect.poll(() => page.evaluate(() => webui.getData('webui-version'))).toBe(version);
    await expect(el.locator('a')).toHaveAttribute('title', `Web UI version ${version}`);
});
test('matches the version file', async ({ page }) => {
    const root = await mount(page, '<webui-poweredby></webui-poweredby>');
    const version = await page.evaluate(() => fetch('/webui/version').then(r => r.text()));
    await expect(root.locator('webui-poweredby')).toHaveAttribute('version', version.trim());
});
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
