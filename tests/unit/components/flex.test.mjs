import { test, expect, mount } from '../support/webui.mjs';

// webui-flex is a layout part: turning its attributes into flex settings is all it does, so it is tested by the
// settings it applies. Where its items end up is checked by eye.
test('attributes control gap, alignment, and direction', async ({ page }) => {
    const root = await mount(page, '<webui-flex gap="10" justify="center" align="end" column grow wrap></webui-flex>');
    await expect.poll(() => root.locator('webui-flex').evaluate(el => {
        const style = getComputedStyle(el);
        return [style.columnGap, style.justifyContent, style.alignItems, style.flexDirection, style.flexGrow, style.flexWrap];
    })).toEqual(['10px', 'center', 'end', 'column', '1', 'wrap']);
});
test('page styles and inline styles can hide it', async ({ page }) => {
    const root = await mount(page, '<webui-flex class="hide">a</webui-flex><webui-flex class="shown">b</webui-flex>');
    await expect(root.locator('webui-flex.hide')).toBeHidden();
    const shown = root.locator('webui-flex.shown');
    await expect(shown).toBeVisible();
    await shown.evaluate(el => { el.style.display = 'none'; });
    await expect(shown).toBeHidden();
    await shown.evaluate(el => { el.style.display = ''; });
    await expect(shown).toBeVisible();
});

