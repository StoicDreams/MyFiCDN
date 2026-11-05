import { test, expect, mount } from '../support/webui.mjs';

test('displays its placeholder content', async ({ page }) => {
    const root = await mount(page, '<webui-myfi-dev-settings></webui-myfi-dev-settings>');
    await expect(root.locator('webui-myfi-dev-settings')).toContainText('Coming Soon!');
});
