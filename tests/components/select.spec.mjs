import { test, expect, mount } from '../support/webui.mjs';

// webui-select: a field like webui-dropdown that opens its options as a grid of tiles in a dialog.
const OPTIONS = [
    { id: 'storefront', display: 'Acme Storefront' },
    { id: 'docs', display: 'Docs', icon: 'book-open' },
    { id: 'api', display: 'Payments API' },
];
const attribute = value => JSON.stringify(value).replace(/'/g, '&#39;');
const select = async (page, attrs = '', options = OPTIONS) => {
    const root = await mount(page, `<webui-dialogs></webui-dialogs><webui-select label="Project" ${attrs} options='${attribute(options)}'></webui-select>`);
    const el = root.locator('webui-select');
    // Options are read once the component is ready, which a multiple select shows with nothing chosen yet.
    await expect.poll(() => el.evaluate(e => !!e._optionsSet)).toBe(true);
    return el;
};
const field = el => el.getByRole('button');
const dialog = page => page.locator('webui-dialogs dialog');
const tile = (page, name) => page.locator('.webui-select-dialog').getByRole('option', { name });
const tiles = page => page.locator('.webui-select-dialog').getByRole('option');
// A tile's name, without the initials its picture draws.
const names = page => page.locator('.webui-select-dialog .tile:not([hidden]) .name');
const value = el => el.evaluate(e => e.value);

test('the field shows the chosen option, and a single select starts on the first one', async ({ page }) => {
    const el = await select(page);
    await expect(el.locator('.pick-name')).toHaveText(['Acme Storefront']);
    await expect.poll(() => value(el)).toBe('storefront');
    await expect(el.locator('label')).toContainText('Project');
    // The label names the field.
    await expect(page.getByRole('button', { name: 'Project' })).toHaveCount(1);
});

test('the field opens the options as tiles in a dialog, each with its name, the chosen one marked', async ({ page }) => {
    const el = await select(page, 'value="docs"');
    await field(el).click();
    await expect(dialog(page)).toBeVisible();
    await expect(names(page)).toHaveText(['Acme Storefront', 'Docs', 'Payments API']);
    await expect(tile(page, 'Docs')).toHaveAttribute('aria-selected', 'true');
    await expect(tile(page, 'Payments API')).toHaveAttribute('aria-selected', 'false');
    // A single select closes on a pick, so the dialog has no confirm button.
    await expect(page.locator('webui-dialogs #dlg-confirm')).toBeHidden();
});

test('an option with an icon shows it, and one without shows its initials', async ({ page }) => {
    const el = await select(page);
    await field(el).click();
    await expect(tile(page, 'Docs').locator('webui-icon')).toHaveAttribute('icon', 'book-open');
    await expect(tile(page, 'Acme Storefront').locator('svg.fallback text')).toHaveText('AS');
    await expect(tile(page, 'Payments API').locator('svg.fallback text')).toHaveText('PA');
});

test('picking a tile chooses it, closes the dialog, and tells listeners and bound data', async ({ page }) => {
    const el = await select(page, 'data-bind="chosen-project" data-name="chosen-item"');
    await el.evaluate(e => { window.__changes = []; e.addEventListener('change', () => window.__changes.push(e.value)); });
    await field(el).click();
    await tile(page, 'Payments API').click();
    await expect(dialog(page)).toBeHidden();
    await expect.poll(() => value(el)).toBe('api');
    await expect(el.locator('.pick-name')).toHaveText(['Payments API']);
    await expect.poll(() => page.evaluate(() => window.__changes)).toEqual(['api']);
    await expect.poll(() => page.evaluate(() => webui.getData('chosen-project'))).toBe('api');
    await expect.poll(() => page.evaluate(() => webui.getData('chosen-item'))).toEqual({ id: 'api', display: 'Payments API' });
});

test('picking the option already chosen changes nothing', async ({ page }) => {
    const el = await select(page);
    await el.evaluate(e => { window.__changes = 0; e.addEventListener('change', () => window.__changes++); });
    await field(el).click();
    await tile(page, 'Acme Storefront').click();
    await expect(dialog(page)).toBeHidden();
    expect(await page.evaluate(() => window.__changes)).toBe(0);
});

test('a multiple select toggles tiles, keeps the dialog open, and closes with Done', async ({ page }) => {
    const el = await select(page, 'multiple');
    await field(el).click();
    await tile(page, 'Payments API').click();
    await tile(page, 'Acme Storefront').click();
    await expect(tile(page, 'Payments API')).toHaveAttribute('aria-selected', 'true');
    await expect(tile(page, 'Acme Storefront')).toHaveAttribute('aria-selected', 'true');
    // Kept in the options' order, whatever order they were picked in.
    await expect.poll(() => el.evaluate(e => e.values)).toEqual(['storefront', 'api']);
    await tile(page, 'Payments API').click();
    await expect.poll(() => el.evaluate(e => e.values)).toEqual(['storefront']);
    await page.locator('webui-dialogs #dlg-confirm').click();
    await expect(dialog(page)).toBeHidden();
    await expect(el.locator('.pick-name')).toHaveText(['Acme Storefront']);
    await expect.poll(() => value(el)).toBe('storefront');
});

test('the keyboard moves through the grid, and Enter picks', async ({ page }) => {
    const options = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, display: `Project ${i}` }));
    const el = await select(page, 'value="p0"', options);
    await field(el).focus();
    await page.keyboard.press('Enter');
    await expect(tile(page, 'Project 0')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(tile(page, 'Project 1')).toBeFocused();
    await page.keyboard.press('End');
    await expect(tile(page, 'Project 7')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(tile(page, 'Project 0')).toBeFocused();
    // Down moves a whole row, however many tiles fit across.
    const across = await tiles(page).evaluateAll(all => all.filter(t => t.offsetTop === all[0].offsetTop).length);
    await page.keyboard.press('ArrowDown');
    await expect(tile(page, `Project ${Math.min(across, 7)}`)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(dialog(page)).toBeHidden();
    await expect.poll(() => value(el)).toBe(`p${Math.min(across, 7)}`);
});

test('many options add a filter that narrows the tiles', async ({ page }) => {
    const options = Array.from({ length: 14 }, (_, i) => ({ id: `p${i}`, display: i % 2 ? `Website ${i}` : `Service ${i}` }));
    const el = await select(page, '', options);
    await field(el).click();
    const filter = page.locator('.webui-select-dialog').getByRole('searchbox', { name: 'Filter the options' });
    await filter.fill('website');
    await expect(names(page)).toHaveText(options.filter((_, i) => i % 2).map(o => o.display));
});

test('a few options have no filter', async ({ page }) => {
    const el = await select(page);
    await field(el).click();
    await expect(tiles(page)).toHaveCount(3);
    await expect(page.locator('.webui-select-dialog').getByRole('searchbox')).toHaveCount(0);
});

test('names from data are shown as text, never markup', async ({ page }) => {
    const el = await select(page, '', [{ id: 'x', display: '<img src=x onerror="window.__ran=1">Bad' }]);
    await field(el).click();
    await expect(names(page)).toHaveText(['<img src=x onerror="window.__ran=1">Bad']);
    await expect(el.locator('.pick-name')).toHaveText('<img src=x onerror="window.__ran=1">Bad');
    expect(await page.evaluate(() => window.__ran)).toBeUndefined();
});

test('options can be set as a list, read from other fields, and a value set before them applies', async ({ page }) => {
    const root = await mount(page, '<webui-dialogs></webui-dialogs><webui-select value="b" options="Alpha|a, Beta|b"></webui-select>');
    const el = root.locator('webui-select');
    await expect(el.locator('.pick-name')).toHaveText(['Beta']);
    await el.evaluate(e => {
        e.dataset.id = 'key';
        e.dataset.display = 'title';
        e.dataset.icon = 'glyph';
        e.setOptions([{ key: 'k1', title: 'Keyed', glyph: 'gear' }]);
    });
    await expect(el.locator('.pick-name')).toHaveText(['Keyed']);
    await expect.poll(() => value(el)).toBe('k1');
    await field(el).click();
    await expect(tile(page, 'Keyed').locator('webui-icon')).toHaveAttribute('icon', 'gear');
});

test('a disabled select does not open', async ({ page }) => {
    const el = await select(page, 'disabled');
    await expect(field(el)).toBeDisabled();
    await expect(el).toHaveAttribute('aria-disabled', 'true');
    await field(el).click({ force: true });
    await expect(dialog(page)).toBeHidden();
});

test('setting the value from code chooses that option, and an unknown one falls back to the first', async ({ page }) => {
    const el = await select(page);
    await el.evaluate(e => { e.value = 'api'; });
    await expect(el.locator('.pick-name')).toHaveText(['Payments API']);
    await el.evaluate(e => { e.value = 'gone'; });
    await expect.poll(() => value(el)).toBe('storefront');
});

test('an option with an image shows it, and one whose image cannot load shows its monogram', async ({ page }) => {
    const pixel = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1"/></svg>');
    const el = await select(page, 'value="logo"', [
        { id: 'logo', display: 'logo.svg', image: pixel },
        { id: 'broken', display: 'Broken Image', image: 'https://example.invalid/missing.png' },
    ]);
    await page.route('https://example.invalid/**', route => route.fulfill({ status: 404, body: '' }));
    await expect(el.locator('.pick-picture img')).toHaveAttribute('src', pixel);
    await field(el).click();
    await expect(tile(page, 'logo.svg').locator('img')).toHaveAttribute('src', pixel);
    await expect(tile(page, 'Broken Image').locator('svg.fallback text')).toHaveText('BI');
    await expect(tile(page, 'Broken Image').locator('img')).toHaveCount(0);
});
