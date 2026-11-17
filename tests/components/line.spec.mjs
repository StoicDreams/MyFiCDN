import { test, expect, mount } from '../support/webui.mjs';

test('draws a line', async ({ page }) => {
    const root = await mount(page, '<webui-line style="display:block;width:200px"></webui-line>');
    const line = root.locator('webui-line div');
    await expect(line).toBeVisible();
});
test('size sets the thickness', async ({ page }) => {
    const root = await mount(page, '<webui-line size="6"></webui-line>');
    expect(await root.locator('webui-line').evaluate(c => c.style.getPropertyValue('--line-size'))).toBe('6px');
});
// Not a particular color, only that the line isn't see-through, which would leave nothing to see.
test('the line can be seen', async ({ page }) => {
    const root = await mount(page, '<webui-line></webui-line>');
    expect(await root.locator('webui-line div').evaluate(d => getComputedStyle(d).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
});
