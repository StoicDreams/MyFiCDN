import { test, expect, mount } from '../support/webui.mjs';

test('registers and keeps its content', async ({ page }) => {
    const root = await mount(page, '<webui-side-by-side><p>Body</p></webui-side-by-side>');
    await expect(root.locator('webui-side-by-side p')).toHaveText('Body');
    expect(await page.evaluate(() => !!customElements.get('webui-side-by-side'))).toBe(true);
});
test('elevation applies', async ({ page }) => {
    const root = await mount(page, '<webui-side-by-side elevation="10"></webui-side-by-side>');
    await expect(root.locator('webui-side-by-side')).toHaveClass(/elevation-10/);
});
