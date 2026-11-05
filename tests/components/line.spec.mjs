import { test, expect, mount } from '../support/webui.mjs';

test('draws a line that fills the width', async ({ page }) => {
    const root = await mount(page, '<webui-line style="display:block;width:200px"></webui-line>');
    const line = root.locator('webui-line div');
    await expect(line).toBeAttached();
    expect(await line.evaluate(d => d.getBoundingClientRect().width)).toBeGreaterThan(0);
});
test('size sets the thickness', async ({ page }) => {
    const root = await mount(page, '<webui-line size="6"></webui-line>');
    expect(await root.locator('webui-line').evaluate(c => c.style.getPropertyValue('--line-size'))).toBe('6px');
});
test('the line has a visible color', async ({ page }) => {
    const root = await mount(page, '<webui-line></webui-line>');
    expect(await root.locator('webui-line div').evaluate(d => getComputedStyle(d).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
});
