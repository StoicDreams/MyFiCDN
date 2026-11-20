import { test, expect, mount } from '../support/webui.mjs';

/** The tab button for a component, by its name. */
async function tabButton(root, name) {
    const buttons = root.locator('webui-components > webui-tabs > webui-button');
    await expect(buttons.first()).toBeAttached();
    const index = await buttons.evaluateAll((list, name) => list.findIndex(b => b.textContent.trim() === name), name);
    return index === -1 ? null : buttons.nth(index);
}
test('a link to another component opens its tab instead of leaving the page', async ({ page }) => {
    for (const nohash of [false, true]) {
        const root = await mount(page, `<webui-components${nohash ? ' nohash' : ''}></webui-components>`);
        const tabs = root.locator('webui-components > webui-tabs');
        // webui-components' own docs link to webui-tabs.
        await (await tabButton(root, 'webui-components')).click();
        const link = tabs.locator('a[href="/components#webui-tabs"]').first();
        await expect(link).toBeVisible();
        const path = await page.evaluate(() => location.pathname);
        await link.click();
        const target = await tabs.evaluate(el => Array.from(el.querySelectorAll(':scope > [slot="tabs"]')).findIndex(b => b.textContent.trim() === 'webui-tabs'));
        await expect.poll(() => tabs.evaluate(el => el._index)).toBe(target);
        await expect.poll(() => page.evaluate(() => location.pathname)).toBe(path);
    }
});
