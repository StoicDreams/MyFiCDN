import { test, expect, mount } from '../support/webui.mjs';

const search = async page => {
    await page.setViewportSize({ width: 1600, height: 1200 });
    await page.waitForTimeout(250);
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
    await page.route('**/webui/pagination.*', async route => {
        await new Promise(r => setTimeout(r, 1000));
        await route.fallback();
    });
    const root = await mount(page, '<webui-icon-search></webui-icon-search>');
    await page.evaluate(() => customElements.whenDefined('webui-pagination'));
    const el = root.locator('webui-icon-search');
    await expect.poll(() => el.evaluate(c => c.totalCount), { timeout: 5000 }).toBeGreaterThan(20);
    // The pagination hides itself until it has a page count.
    await expect.poll(() => el.evaluate(c => Number(c._pag.getAttribute('page-count')))).toBeGreaterThan(1);
});
test('search filters by name', async ({ page }) => {
    const el = await search(page);
    await el.evaluate(c => { c._inputSearch.value = 'bell'; c._inputSearch.triggerChange(true); });
    await expect.poll(() => el.evaluate(c => c._filteredKeys.map(k => k.name))).toContain('bell');
    // Every result is named or tagged with the search, such as bell-slash.
    expect(await el.evaluate(c => c._filteredKeys.every(k => `${k.name} ${k.tags || ''}`.includes('bell')))).toBe(true);
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
test('the rotation buttons step by 15 degrees and loop', async ({ page }) => {
    const el = await search(page);
    const rotation = () => el.evaluate(c => [c._rotate.value, c._iconPreview.getAttribute('rotate')]);
    const left = el.locator('webui-button[aria-label="Rotate left 15 degrees"]');
    const right = el.locator('webui-button[aria-label="Rotate right 15 degrees"]');
    await left.click();
    await expect.poll(rotation).toEqual(['345', '345']);
    await right.click();
    await expect.poll(rotation).toEqual(['0', null]);
    // From a value between steps, each button goes to the nearest step in its direction.
    await el.evaluate(c => { c._rotate.value = 50; });
    await right.click();
    await expect.poll(rotation).toEqual(['60', '60']);
    await el.evaluate(c => { c._rotate.value = 50; });
    await left.click();
    await expect.poll(rotation).toEqual(['45', '45']);
});
test('offers a page size, which changes how many icons show', async ({ page }) => {
    const el = await search(page);
    await expect.poll(() => el.evaluate(c => c._containers.length)).toBe(20);
    await el.locator('webui-pagination select').selectOption('50');
    await expect.poll(() => el.evaluate(c => c._containers.length)).toBe(50);
});
