import { test, expect, mount } from '../support/webui.mjs';

test('displays children in a flex row', async ({ page }) => {
    const root = await mount(page, '<webui-flex><i></i></webui-flex>');
    expect(await root.locator('webui-flex').evaluate(el => getComputedStyle(el).display)).toBe('flex');
});
test('attributes control gap, alignment, and direction', async ({ page }) => {
    const root = await mount(page, '<webui-flex gap="10" justify="center" align="end" column grow wrap></webui-flex>');
    expect(await root.locator('webui-flex').evaluate(el => {
        const style = getComputedStyle(el);
        return [style.columnGap, style.justifyContent, style.alignItems, style.flexDirection, style.flexGrow, style.flexWrap];
    })).toEqual(['10px', 'center', 'end', 'column', '1', 'wrap']);
});
test('wrap-at wraps below the given width, including after a move', async ({ page }) => {
    const root = await mount(page, '<webui-flex wrap-at="300" style="width:500px"></webui-flex>');
    const el = root.locator('webui-flex');
    await expect(el).not.toHaveAttribute('wrap');
    await el.evaluate(c => { c.style.width = '200px'; });
    await expect(el).toHaveAttribute('wrap', '');
    await el.evaluate(c => { const p = c.parentNode; c.remove(); p.appendChild(c); c.style.width = '500px'; });
    await expect(el).not.toHaveAttribute('wrap');
});
test('classes still style the element from the page stylesheet', async ({ page }) => {
    const root = await mount(page, '<webui-flex class="pa-3"></webui-flex>');
    expect(await root.locator('webui-flex').evaluate(el => getComputedStyle(el).paddingTop)).not.toBe('0px');
});
