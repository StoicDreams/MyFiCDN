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
    await expect(image).toHaveAttribute('src', '/x" onerror="window.__hacked=1');
    await expect.poll(() => image.getAttribute('onerror')).toBeNull();
    await expect.poll(() => page.evaluate(() => window.__hacked)).toBeUndefined();
});
test('inline svg is used directly, and removing src clears it', async ({ page }) => {
    const root = await mount(page, '<webui-avatar src="<svg></svg>"></webui-avatar>');
    const avatar = root.locator('webui-avatar');
    await expect(avatar.locator('svg')).toHaveCount(1);
    await avatar.evaluate(el => el.removeAttribute('src'));
    await expect(avatar.locator('svg')).toHaveCount(0);
});
test('an image is described by alt, and is decoration without it', async ({ page }) => {
    const root = await mount(page, '<webui-avatar id="named" src="/img/a.png" alt="Erik"></webui-avatar><webui-avatar id="plain" src="/img/b.png"></webui-avatar>');
    await expect(root.locator('#named img')).toHaveAttribute('alt', 'Erik');
    await expect(root.locator('#plain img')).toHaveAttribute('alt', '');
    await root.locator('#plain').evaluate(a => a.setAttribute('alt', 'Someone'));
    await expect(root.locator('#plain img')).toHaveAttribute('alt', 'Someone');
});
