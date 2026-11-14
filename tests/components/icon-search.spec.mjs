import { test, expect, mount } from '../support/webui.mjs';
import { ALL_KEYWORDS } from '../../tools/icons/keywords.mjs';

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
test('search matches every word, plurals, and phrases with small words', async ({ page }) => {
    const el = await search(page);
    const find = query => el.evaluate((c, q) => { c.runLocalFilter(q); return c._filteredKeys.map(k => k.name); }, query);
    expect(await find('api')).toContain('plug');
    // A plural finds the singular tag, and "us" is skipped.
    expect(await find('reports')).toContain('flag');
    expect(await find('categories')).toContain('tags');
    expect(await find('contact us')).toContain('phone-handset');
    // Every word has to match, in the name or the tags.
    expect(await find('sign in')).toContain('arrow-side-into-square');
    expect(await find('sign in')).not.toContain('signature');
    expect(await find('user-plus')).toEqual(['user-plus']);
});
test('every common name for a page, button, or status finds an icon', async ({ page }) => {
    // tools/icons/keywords.mjs lists them. A miss needs a tag on the icon that fits, or a new icon.
    const el = await search(page);
    const missing = await el.evaluate((c, words) => words.filter(word => { c.runLocalFilter(word); return c._filteredKeys.length === 0; }), ALL_KEYWORDS);
    expect(missing).toEqual([]);
});
test('shape, theme, stroke, and shade are switches of the current icon drawn each way', async ({ page }) => {
    const el = await search(page);
    await el.evaluate(c => c.setIcon('bell'));
    const option = (sw, value) => el.evaluate((c, [sw, value]) => c[sw].shadowRoot.querySelector(`button[data-value="${value}"]`), [sw, value]);
    const iconOf = (sw, value) => el.evaluate((c, [sw, value]) => c[sw].shadowRoot.querySelector(`button[data-value="${value}"] webui-icon`)?.getAttribute('icon'), [sw, value]);
    await expect.poll(() => iconOf('_shape', 'heart')).toBe('heart_bell|bordered');
    expect(await iconOf('_theme', 'danger')).toBe('bell|fill|theme:danger');
    expect(await iconOf('_stroke', 'thick')).toBe('bell|stroke:thick');
    expect(await iconOf('_shade', 'duo')).toBe('bell|fill|shade:duo');
    expect(await option('_shape', 'gear')).toBeTruthy();
    await el.evaluate(c => ['_shape:gear', '_theme:danger', '_stroke:thick'].forEach(pick => {
        const [sw, value] = pick.split(':');
        c[sw].shadowRoot.querySelector(`button[data-value="${value}"]`).click();
    }));
    await expect.poll(() => el.evaluate(c => c.pipedValue)).toBe('gear_bell|theme:danger|stroke:thick');
    // Square, Regular, and None leave the attribute off.
    await el.evaluate(c => ['_shape', '_stroke'].forEach(sw => c[sw].shadowRoot.querySelector('button[data-value="none"]').click()));
    await expect.poll(() => el.evaluate(c => c.pipedValue)).toBe('bell|theme:danger');
    // Code sets the switches, and a new icon redraws them.
    await el.evaluate(c => c.setIconFromCode('tri_star|stroke:thin'));
    await expect.poll(() => el.evaluate(c => [c._shape.value, c._stroke.value, c._theme.value])).toEqual(['triangle', 'thin', 'none']);
    await expect.poll(() => iconOf('_shape', 'heart')).toBe('heart_star|bordered');
});
test('the switches start on the choice that leaves the icon as it is, so the first click applies', async ({ page }) => {
    const el = await search(page);
    // Stroke lists Thin first, which once showed as selected on load, so clicking it did nothing.
    expect(await el.evaluate(c => [c._theme.value, c._shape.value, c._stroke.value, c._shade.value])).toEqual(['none', 'none', 'none', 'none']);
    expect(await el.evaluate(c => c._stroke.shadowRoot.querySelector('[aria-checked="true"]').dataset.value)).toBe('none');
    await el.evaluate(c => c._stroke.shadowRoot.querySelector('button[data-value="thin"]').click());
    await expect.poll(() => el.evaluate(c => c._iconPreview.getAttribute('stroke'))).toBe('thin');
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
test('setIconFromCode called before the component has set itself up waits for it, instead of failing', async ({ page }) => {
    // The component sets itself up once the components it preloads arrive, which can be slow on a busy network.
    await page.route('**/webui/pagination*.js', async route => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.fallback();
    });
    await page.evaluate(() => {
        const root = document.createElement('div');
        root.id = 'test-root';
        root.innerHTML = '<webui-icon-search></webui-icon-search>';
        document.body.appendChild(root);
    });
    const el = page.locator('webui-icon-search');
    await page.evaluate(() => customElements.whenDefined('webui-icon-search'));
    await el.evaluate(c => { c.setIconFromCode('bell|fill'); });
    await expect.poll(() => el.evaluate(c => !!c._iconPreview && c._iconPreview.hasAttribute('fill')), { timeout: 15000 }).toBe(true);
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
test('the code puts the shape before the icon name, and reads it back', async ({ page }) => {
    const el = await search(page);
    await el.evaluate(c => c.setIconFromCode('bell_circle|fill'));
    await expect.poll(() => el.evaluate(c => c.pipedValue)).toBe('circle_bell|fill');
    expect(await el.evaluate(c => c._codeSample.value)).toContain('icon="circle_bell"');
    expect(await el.evaluate(c => c._codeSample.value)).not.toContain('shape=');
    await expect.poll(() => el.evaluate(c => c._containers[0].el.getAttribute('icon'))).toMatch(/^circle_[^|]+\|fill$/);
});
