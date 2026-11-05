import { test, expect, mount } from '../support/webui.mjs';

test('replaces itself with a side image and message', async ({ page }) => {
    const root = await mount(page, '<webui-under-construction></webui-under-construction>');
    await expect(root.locator('webui-under-construction')).toHaveCount(0);
    const side = root.locator('webui-sideimage');
    await expect(side.locator('img')).toHaveAttribute('src', /spaceship/);
    await expect(side).toContainText('My Fidelity CDN');
    await expect(side).toContainText('is under construction');
});
test('app-under-construction replaces the message', async ({ page }) => {
    await page.evaluate(() => webui.setData('app-under-construction', 'Back soon'));
    const root = await mount(page, '<webui-under-construction></webui-under-construction>');
    await expect(root.locator('webui-sideimage')).toContainText('Back soon');
});
