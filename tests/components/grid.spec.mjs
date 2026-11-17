import { test, expect, mount } from '../support/webui.mjs';

// webui-grid is a layout part: turning its attributes into the grid's settings is all it does, so it is tested by the
// settings it applies, never by where its items end up. How the grid looks is checked by eye.
const columns = root => root.locator('webui-grid').evaluate(el => el.style.getPropertyValue('--columns'));
test('a column count makes that many equal columns', async ({ page }) => {
    const root = await mount(page, '<webui-grid columns="3"><i></i><i></i><i></i></webui-grid>');
    expect(await columns(root)).toBe('repeat(3, minmax(var(--min), var(--max)))');
});
test('a template passes through', async ({ page }) => {
    const root = await mount(page, '<webui-grid columns="100px 50px"><i></i><i></i></webui-grid>');
    expect(await columns(root)).toBe('100px 50px');
});
test('gap, min, max, width, and height set their values', async ({ page }) => {
    const root = await mount(page, '<webui-grid gap="4" min="10" max="20" height="30"></webui-grid>');
    const el = root.locator('webui-grid');
    expect(await el.evaluate(c => [c.style.gap, c.style.getPropertyValue('--min'), c.style.getPropertyValue('--max'), c.style.getPropertyValue('--height')])).toEqual(['4px', '10px', '20px', '30px']);
    await el.evaluate(c => c.setAttribute('width', '40'));
    expect(await el.evaluate(c => c.style.getPropertyValue('--min'))).toBe('40px');
});
