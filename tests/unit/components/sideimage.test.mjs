import { test, expect, mount } from '../support/webui.mjs';

test('places the image and moves content beside it', async ({ page }) => {
    const root = await mount(page, '<webui-sideimage src="/a/pic.png"><p>Body</p></webui-sideimage>');
    const el = root.locator('webui-sideimage');
    await expect(el).toHaveClass(/side-by-side/);
    await expect(el.locator('img')).toHaveAttribute('src', '/a/pic.png');
    await expect(el.locator('img')).toHaveAttribute('alt', 'pic.png');
    await expect(el.locator('webui-paper p')).toHaveText('Body');
});
test('alt is respected, and reverse puts the image first', async ({ page }) => {
    const root = await mount(page, '<webui-sideimage alt="Mine" src="/a.png" reverse></webui-sideimage>');
    const el = root.locator('webui-sideimage');
    await expect(el.locator('img')).toHaveAttribute('alt', 'Mine');
    await expect(el.locator(':scope > webui-flex').first().locator('img')).toHaveCount(1);
});
