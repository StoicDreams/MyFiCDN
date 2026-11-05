import { test, expect, mount } from '../support/webui.mjs';

test('displays as a grid', async ({ page }) => {
    const root = await mount(page, '<webui-grid><i></i></webui-grid>');
    expect(await root.locator('webui-grid').evaluate(el => getComputedStyle(el).display)).toBe('grid');
});
test('a column count makes that many columns', async ({ page }) => {
    const root = await mount(page, '<webui-grid columns="3" style="width:300px"><i></i><i></i><i></i></webui-grid>');
    expect(await root.locator('webui-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(3);
});
test('a template passes through', async ({ page }) => {
    const root = await mount(page, '<webui-grid columns="100px 50px" style="width:300px"><i></i><i></i></webui-grid>');
    expect(await root.locator('webui-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns)).toBe('100px 50px');
});
test('gap, min, max, width, and height set their values', async ({ page }) => {
    const root = await mount(page, '<webui-grid gap="4" min="10" max="20" height="30"></webui-grid>');
    const el = root.locator('webui-grid');
    expect(await el.evaluate(c => [c.style.gap, c.style.getPropertyValue('--min'), c.style.getPropertyValue('--max'), c.style.getPropertyValue('--height')])).toEqual(['4px', '10px', '20px', '30px']);
    await el.evaluate(c => c.setAttribute('width', '40'));
    expect(await el.evaluate(c => c.style.getPropertyValue('--min'))).toBe('40px');
});
