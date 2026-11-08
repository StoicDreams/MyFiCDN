import { test, expect, mount } from '../support/webui.mjs';

test('lists a tab for every entry in components.json', async ({ page }) => {
    const names = await page.evaluate(() => webui.fetchWithCache('/webui/components.json', true));
    await page.evaluate(() => { window.__fetch = window.fetch; });
    const root = await mount(page, '<webui-components></webui-components>');
    const buttons = root.locator('webui-components > webui-tabs > webui-button');
    await expect(buttons).toHaveCount(names.length);
    await expect(buttons.first()).toHaveAttribute('hash', names[0]);
    await expect(root.locator('webui-components > webui-alert')).toHaveCount(0);
});
test('shows an error when the list cannot load', async ({ page }) => {
    await page.route('**/webui/components.json', route => route.fulfill({ status: 500, body: '' }));
    const root = await mount(page, '<webui-components></webui-components>');
    await expect(root.locator('webui-alert')).toContainText('Failed to load components');
});
/** The tab button for a component, by its name. */
async function tabButton(root, name) {
    const buttons = root.locator('webui-components > webui-tabs > webui-button');
    await expect(buttons.first()).toBeAttached();
    const index = await buttons.evaluateAll((list, name) => list.findIndex(b => b.textContent.trim() === name), name);
    return index === -1 ? null : buttons.nth(index);
}
test('exclude leaves out the named components', async ({ page }) => {
    const names = await page.evaluate(() => webui.fetchWithCache('/webui/components.json', true));
    const root = await mount(page, '<webui-components exclude="app-template, webui-app webui-app-config"></webui-components>');
    const buttons = root.locator('webui-components > webui-tabs > webui-button');
    await expect(buttons).toHaveCount(names.length - 3);
    expect(await tabButton(root, 'webui-app')).toBeNull();
    expect(await tabButton(root, 'webui-alert')).not.toBeNull();
});
test('nohash tabs leave the url alone', async ({ page }) => {
    const root = await mount(page, '<webui-components nohash></webui-components>');
    const buttons = root.locator('webui-components > webui-tabs > webui-button');
    await expect(buttons.first()).toBeVisible();
    await expect(buttons.first()).not.toHaveAttribute('hash');
    const url = page.url();
    await (await tabButton(root, 'webui-button')).click();
    const tabs = root.locator('webui-components > webui-tabs');
    const target = await tabs.evaluate(el => Array.from(el.querySelectorAll(':scope > [slot="tabs"]')).findIndex(b => b.textContent.trim() === 'webui-button'));
    await expect.poll(() => tabs.evaluate(el => el._index)).toBe(target);
    expect(page.url()).toBe(url);
});
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
        expect(await page.evaluate(() => location.pathname)).toBe(path);
    }
});
