import { test, expect, mount } from '../support/webui.mjs';

test('percent sets the bar width', async ({ page }) => {
    const root = await mount(page, '<webui-loading-bar percent="40"></webui-loading-bar>');
    expect(await root.locator('webui-loading-bar div').nth(1).evaluate(d => d.style.width)).toBe('40%');
});
test('bad percent values become zero', async ({ page }) => {
    const root = await mount(page, '<webui-loading-bar percent="abc"></webui-loading-bar>');
    expect(await root.locator('webui-loading-bar div').nth(1).evaluate(d => d.style.width)).toBe('0%');
});
test('height sets the size', async ({ page }) => {
    const root = await mount(page, '<webui-loading-bar height="8"></webui-loading-bar>');
    expect(await root.locator('webui-loading-bar').evaluate(c => [c.style.height, c.style.minHeight])).toEqual(['8px', '8px']);
});
test('indeterminate and striped flags animate', async ({ page }) => {
    const root = await mount(page, '<webui-loading-bar indeterminate striped height="8"></webui-loading-bar>');
    const el = root.locator('webui-loading-bar');
    expect(await el.evaluate(c => [c.indeterminate, c.striped])).toEqual([true, true]);
    expect(await el.locator('div').first().evaluate(d => getComputedStyle(d).animationName)).not.toBe('none');
});
