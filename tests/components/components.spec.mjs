import { test, expect, mount } from '../support/webui.mjs';

test('lists a tab for every entry in components.json', async ({ page }) => {
    const names = await page.evaluate(() => webui.fetchWithCache('/webui/components.json', true));
    await page.evaluate(() => { window.__fetch = window.fetch; });
    const root = await mount(page, '<webui-components></webui-components>');
    const buttons = root.locator('webui-components webui-tabs > webui-button');
    await expect(buttons).toHaveCount(names.length);
    await expect(buttons.first()).toHaveAttribute('hash', names[0]);
    await expect(root.locator('webui-components > webui-alert')).toHaveCount(0);
});
test('shows an error when the list cannot load', async ({ page }) => {
    await page.route('**/webui/components.json', route => route.fulfill({ status: 500, body: '' }));
    const root = await mount(page, '<webui-components></webui-components>');
    await expect(root.locator('webui-alert')).toContainText('Failed to load components');
});
