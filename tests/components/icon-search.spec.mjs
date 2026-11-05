import { test, expect, mount } from '../support/webui.mjs';

const search = async page => {
    await page.setViewportSize({ width: 1600, height: 1200 });
    await page.waitForTimeout(250);
    // Avoids the known loading race tested below.
    await mount(page, '<webui-pagination></webui-pagination>');
    const root = await mount(page, '<webui-icon-search></webui-icon-search>');
    const el = root.locator('webui-icon-search');
    await expect.poll(() => el.evaluate(c => c._containers?.length || 0), { timeout: 10000 }).toBeGreaterThan(0);
    // The total arriving triggers one more render, which selects the first icon.
    await page.waitForTimeout(400);
    return el;
};

test('lists icons and previews the first', async ({ page }) => {
    const el = await search(page);
    await expect.poll(() => el.evaluate(c => c.totalCount)).toBeGreaterThan(20);
    await expect.poll(() => el.evaluate(c => c._iconPreview.getAttribute('icon'))).toBeTruthy();
});
test('keeps the total when pagination loads after the icon list', async ({ page }) => {
    test.fail(true, 'Known bug: webui-pagination is not in preload, so a total set before it loads is lost and paging disappears');
    await page.route('**/webui/pagination.*', async route => {
        await new Promise(r => setTimeout(r, 1000));
        await route.fallback();
    });
    const root = await mount(page, '<webui-icon-search></webui-icon-search>');
    await page.evaluate(() => customElements.whenDefined('webui-pagination'));
    await expect.poll(() => root.locator('webui-icon-search').evaluate(c => c.totalCount), { timeout: 2000 }).toBeGreaterThan(20);
});
test('search filters by name', async ({ page }) => {
    const el = await search(page);
    await el.evaluate(c => { c._inputSearch.value = 'bell'; c._inputSearch.triggerChange(true); });
    await expect.poll(() => el.evaluate(c => c._filteredKeys.map(k => k.name))).toEqual(['bell']);
});
test('clicking an icon selects it and updates the code', async ({ page }) => {
    const el = await search(page);
    await el.evaluate(c => c._containers[1].click());
    const name = await el.evaluate(c => c._containers[1].icon.name);
    await expect.poll(() => el.evaluate(c => c._iconPreview.getAttribute('icon'))).toBe(name);
    await expect.poll(() => el.evaluate(c => c.pipedValue)).toBe(name);
});
test('setIconFromCode applies piped options', async ({ page }) => {
    const el = await search(page);
    await el.evaluate(c => c.setIconFromCode('bell|fill|shape:circle'));
    await expect.poll(() => el.evaluate(c => c.pipedValue)).toContain('bell');
    expect(await el.evaluate(c => [c._iconPreview.hasAttribute('fill'), c._iconPreview.getAttribute('shape')])).toEqual([true, 'circle']);
});
test('the emoji toggle searches emojis instead', async ({ page }) => {
    const el = await search(page);
    await expect.poll(() => el.evaluate(c => c._emojis.length)).toBeGreaterThan(0);
    await el.evaluate(c => { c._emojisToggle.value = true; });
    await expect.poll(() => el.evaluate(c => c._filteredKeys[0]?.name || '')).toMatch(/^emoji-/);
});
