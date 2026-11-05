import { test, expect, mount } from '../support/webui.mjs';

test('registers and keeps its content', async ({ page }) => {
    const root = await mount(page, '<webui-page-segment><p>Body</p></webui-page-segment>');
    await expect(root.locator('webui-page-segment p')).toHaveText('Body');
    expect(await page.evaluate(() => !!customElements.get('webui-page-segment'))).toBe(true);
});
test('elevation applies', async ({ page }) => {
    const root = await mount(page, '<webui-page-segment elevation="10"></webui-page-segment>');
    await expect(root.locator('webui-page-segment')).toHaveClass(/elevation-10/);
});
