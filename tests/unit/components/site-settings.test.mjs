import { test, expect, mount } from '../support/webui.mjs';

test('registers and renders without errors', async ({ page }) => {
    const root = await mount(page, '<webui-site-settings></webui-site-settings>');
    await expect(root.locator('webui-site-settings')).toHaveClass(/content/);
    await expect(root.locator('webui-site-settings')).toHaveText('');
});
