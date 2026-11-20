import { test, expect, mount } from '../support/webui.mjs';

test('shows a focus ring when reached by keyboard', async ({ page }) => {
    const root = await mount(page, '<button id="before">Before</button><webui-toggle-icon title-on="On" title-off="Off" icon-on="bell" icon-off="xmark"></webui-toggle-icon>');
    await root.locator('#before').focus();
    await page.keyboard.press('Tab');
    // The button animates all its styles, so the ring settles at its width after the transition.
    await expect.poll(() => root.locator('webui-toggle-icon').evaluate(el => {
        const style = getComputedStyle(el.shadowRoot.querySelector('button'));
        return `${style.outlineStyle} ${style.outlineWidth}`;
    })).toBe('solid 2px');
});
test('--toggle-icon-padding sets the button padding, which defaults to the Web UI padding at the sides', async ({ page }) => {
    const root = await mount(page, '<webui-toggle-icon id="plain"></webui-toggle-icon><webui-toggle-icon id="tight" style="--toggle-icon-padding:0;"></webui-toggle-icon>');
    const padding = id => root.locator(`#${id} button`).evaluate(b => [getComputedStyle(b).paddingTop, getComputedStyle(b).paddingLeft]);
    await expect.poll(() => padding('plain')).toEqual(['0px', '8px']);
    await expect.poll(() => padding('tight')).toEqual(['0px', '0px']);
});
