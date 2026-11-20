import { test, expect, mount } from '../support/webui.mjs';

const ready = async page => {
    const root = await mount(page, '<webui-dialogs></webui-dialogs>');
    return root.locator('webui-dialogs');
};
// Starts a dialog and records how its promise ends, since opening it has to leave the test free to click.
const open = (page, options) => page.evaluate(options => {
    window.__result = 'open';
    webui.dialog(options).then(() => { window.__result = 'confirmed'; }, reason => { window.__result = reason; });
}, options);
const result = page => page.evaluate(() => window.__result);

test('clicking the backdrop closes it, but clicking inside does not', async ({ page }) => {
    const el = await ready(page);
    await open(page, { content: '<p>Inside</p>' });
    await el.locator('form p').click();
    await expect(el.locator('dialog')).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(el.locator('dialog')).toBeHidden();
    await expect.poll(() => result(page)).toBe('canceled');
});

// The element with focus, looking through shadow roots.
const focused = page => page.evaluate(() => {
    let active = document.activeElement;
    while (active && active.shadowRoot && active.shadowRoot.activeElement) active = active.shadowRoot.activeElement;
    return active ? `${active.tagName.toLowerCase()}${active.name ? `[name=${active.name}]` : ''}` : null;
});

