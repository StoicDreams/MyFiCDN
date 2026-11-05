import { test, expect, mount } from '../support/webui.mjs';

test('short values display as initials', async ({ page }) => {
    const root = await mount(page, '<webui-avatar src="AB"></webui-avatar>');
    await expect(root.locator('webui-avatar slot')).toHaveText('AB');
});
test('names display as icons', async ({ page }) => {
    const root = await mount(page, '<webui-avatar src="person"></webui-avatar>');
    await expect(root.locator('webui-avatar webui-icon')).toHaveAttribute('icon', 'person');
});
test('paths display as images and cannot inject attributes', async ({ page }) => {
    const root = await mount(page, `<webui-avatar src='/x" onerror="window.__hacked=1'></webui-avatar>`);
    const image = root.locator('webui-avatar img');
    await expect(image).toHaveAttribute('alt', 'avatar image');
    expect(await image.getAttribute('onerror')).toBeNull();
    expect(await page.evaluate(() => window.__hacked)).toBeUndefined();
});
test('inline svg is used directly, and removing src clears it', async ({ page }) => {
    const root = await mount(page, '<webui-avatar src="<svg></svg>"></webui-avatar>');
    const avatar = root.locator('webui-avatar');
    await expect(avatar.locator('svg')).toHaveCount(1);
    await avatar.evaluate(el => el.removeAttribute('src'));
    await expect(avatar.locator('svg')).toHaveCount(0);
});
