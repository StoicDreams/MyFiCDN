import { test, expect, mount } from '../support/webui.mjs';

test('adds the default social links', async ({ page }) => {
    const root = await mount(page, '<webui-stoic-social-links></webui-stoic-social-links>');
    await expect(root.locator('webui-stoic-social-links a')).toHaveCount(4);
    await expect(root.locator('a[href*="discord.gg"]')).toBeAttached();
});
test('existing content is kept', async ({ page }) => {
    const root = await mount(page, '<webui-stoic-social-links><p>Own</p></webui-stoic-social-links>');
    await expect(root.locator('webui-stoic-social-links')).toHaveText('Own');
});
