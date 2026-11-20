import { test, expect, mount } from '../support/webui.mjs';

test('shows the default message and image', async ({ page }) => {
    const root = await mount(page, '<webui-page-not-found></webui-page-not-found>');
    const el = root.locator('webui-page-not-found');
    await expect(el).toContainText('was not found');
    await expect(el.locator('img')).toHaveAttribute('alt', 'Page Not Found Graphic');
    await expect.poll(() => page.evaluate(() => webui.getData('page-title'))).toBe('Page Not Found');
});
test('app-not-found-html replaces the default', async ({ page }) => {
    await page.evaluate(() => webui.setData('app-not-found-html', '<p>Custom 404</p>'));
    const root = await mount(page, '<webui-page-not-found></webui-page-not-found>');
    await expect(root.locator('webui-page-not-found')).toHaveText('Custom 404');
});
test('existing content is kept', async ({ page }) => {
    const root = await mount(page, '<webui-page-not-found><p>Own</p></webui-page-not-found>');
    await expect(root.locator('webui-page-not-found')).toHaveText('Own');
});
