import { test, expect, mount } from '../support/webui.mjs';

test('registers and keeps its content', async ({ page }) => {
    const root = await mount(page, '<webui-paper><p>Body</p></webui-paper>');
    await expect(root.locator('webui-paper p')).toHaveText('Body');
    expect(await page.evaluate(() => !!customElements.get('webui-paper'))).toBe(true);
});
test('elevation applies', async ({ page }) => {
    const root = await mount(page, '<webui-paper elevation="10"></webui-paper>');
    await expect(root.locator('webui-paper')).toHaveClass(/elevation-10/);
});
