import { test, expect, mount } from '../support/webui.mjs';

test('documents the webui methods from loader.js', async ({ page }) => {
    const root = await mount(page, '<webui-standard-methods></webui-standard-methods>');
    const buttons = root.locator('webui-standard-methods webui-tabs > webui-button');
    await expect(buttons.first()).toBeAttached();
    const names = await buttons.evaluateAll(all => all.map(b => b.getAttribute('hash')));
    for (const name of ['setData', 'getData', 'define', 'sanitize', 'sanitizeInput', 'appSrc']) {
        expect(names).toContain(name);
    }
    // Method names, such as setData and setTheme, share their first letters, so the list shows names only.
    await expect(root.locator('webui-standard-methods webui-tabs .collapse-toggle')).toHaveAttribute('hidden', '');
});
test('shows an error when the source cannot load', async ({ page }) => {
    await page.route('**/webui/loader.js', route => route.fulfill({ status: 500, body: '' }));
    const root = await mount(page, '<webui-standard-methods></webui-standard-methods>');
    await expect(root.locator('webui-standard-methods webui-alert')).toContainText(/Loading|Failed/);
});
