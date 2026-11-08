import { test, expect, mount } from '../support/webui.mjs';

const pager = async (page, attributes = '') => {
    const root = await mount(page, `<webui-pagination ${attributes}></webui-pagination>`);
    return root.locator('webui-pagination');
};
const rows = n => Array.from({ length: n }, (_, i) => ({ i }));

test('setData calculates pages and total', async ({ page }) => {
    const el = await pager(page, 'per-page="20"');
    await el.evaluate((c, data) => c.setData(data), rows(50));
    await expect(el).toHaveAttribute('page-count', '3');
    await expect(el.locator('.total strong')).toHaveText('50');
});
test('data-current receives only the current page', async ({ page }) => {
    const el = await pager(page, 'per-page="20" data-current="pg-cur"');
    await el.evaluate((c, data) => c.setData(data), rows(50));
    await expect.poll(() => page.evaluate(() => webui.getData('pg-cur')?.length)).toBe(20);
    await el.evaluate(c => c.setValue(2));
    await expect.poll(() => page.evaluate(() => webui.getData('pg-cur')?.[0].i)).toBe(20);
    await el.evaluate(c => c.setValue(3));
    await expect.poll(() => page.evaluate(() => webui.getData('pg-cur')?.length)).toBe(10);
});
test('per-page of one gives the single item', async ({ page }) => {
    const el = await pager(page, 'per-page="1" data-current="pg-one"');
    await el.evaluate((c, data) => c.setData(data), rows(3));
    await el.evaluate(c => c.setValue(2));
    await expect.poll(() => page.evaluate(() => webui.getData('pg-one'))).toEqual({ i: 1 });
});
test('the buttons move between pages and stop at the ends', async ({ page }) => {
    const el = await pager(page, 'per-page="10"');
    await el.evaluate((c, data) => c.setData(data), rows(30));
    await expect(el).toHaveAttribute('page-count', '3');
    // Buttons update shortly after a page change, and a disabled button ignores clicks.
    const go = async selector => {
        await expect(el.locator(selector)).not.toHaveAttribute('disabled');
        await el.locator(selector).evaluate(b => b.click());
    };
    await go('webui-button.next');
    expect(await el.evaluate(c => c.page)).toBe(2);
    await go('webui-button.last');
    expect(await el.evaluate(c => c.page)).toBe(3);
    await el.locator('webui-button.next').evaluate(b => b.click());
    expect(await el.evaluate(c => c.page)).toBe(3);
    await go('webui-button.prev');
    expect(await el.evaluate(c => c.page)).toBe(2);
    await go('webui-button.first');
    expect(await el.evaluate(c => c.page)).toBe(1);
    await el.locator('webui-button.prev').evaluate(b => b.click());
    expect(await el.evaluate(c => c.page)).toBe(1);
});
test('loop wraps around', async ({ page }) => {
    const el = await pager(page, 'per-page="10" loop');
    await el.evaluate((c, data) => c.setData(data), rows(30));
    await expect(el).toHaveAttribute('page-count', '3');
    await el.locator('webui-button.prev').evaluate(b => b.click());
    expect(await el.evaluate(c => c.page)).toBe(3);
    await el.locator('webui-button.next').evaluate(b => b.click());
    expect(await el.evaluate(c => c.page)).toBe(1);
});
test('typing a page number goes there', async ({ page }) => {
    const el = await pager(page, 'per-page="10"');
    await el.evaluate((c, data) => c.setData(data), rows(30));
    await expect(el).toHaveAttribute('page-count', '3');
    await el.locator('input').fill('2');
    expect(await el.evaluate(c => c.page)).toBe(2);
});
test('page numbers display around the current page', async ({ page }) => {
    const el = await pager(page, 'per-page="10" max-pages="3"');
    await el.evaluate((c, data) => c.setData(data), rows(100));
    await el.evaluate(c => c.setValue(5));
    await expect(el.locator('.pages webui-button')).toHaveText([/4/, /6/]);
});
test('a page past the end moves back when data shrinks', async ({ page }) => {
    const el = await pager(page, 'per-page="10"');
    await el.evaluate((c, data) => c.setData(data), rows(30));
    await el.evaluate(c => c.setValue(3));
    await expect(el.locator('input')).toHaveValue('3');
    await el.evaluate((c, data) => c.setData(data), rows(5));
    await expect.poll(() => el.evaluate(c => c.page)).toBe(1);
});
test('fires change, and writes subscribed setValue keys', async ({ page }) => {
    const el = await pager(page, 'per-page="10" data-subscribe="pg-index:setValue"');
    await el.evaluate((c, data) => {
        window.__changes = 0;
        c.addEventListener('change', () => window.__changes++);
        c.setData(data);
    }, rows(30));
    await expect.poll(() => page.evaluate(() => window.__changes)).toBeGreaterThan(0);
    await el.evaluate(c => c.setValue(2));
    await expect.poll(() => page.evaluate(() => webui.getData('pg-index'))).toBe(2);
    await page.evaluate(() => webui.setData('pg-index', 3));
    await expect.poll(() => el.evaluate(c => c.page)).toBe(3);
});
test('accepts json text, and no data hides it', async ({ page }) => {
    const el = await pager(page, 'per-page="1"');
    await el.evaluate(c => c.setData('[{"a":1},{"a":2}]'));
    await expect(el).toHaveAttribute('page-count', '2');
    await el.evaluate(c => c.setData(''));
    await expect.poll(() => el.evaluate(c => c.totalCount)).toBe(0);
});
test('every pagination offers page sizes, with its own per-page among them', async ({ page }) => {
    const el = await pager(page, 'per-page="25"');
    await el.evaluate((c, data) => c.setData(data), rows(60));
    await expect(el.locator('label.per-page')).toBeVisible();
    await expect(el.locator('select option')).toHaveText(['10', '20', '25', '50', '100']);
    await expect(el.locator('select')).toHaveValue('25');
    await el.locator('select').selectOption('10');
    await expect(el).toHaveAttribute('page-count', '6');
});
test('one item at a time, or hide-per-page, has no page size selector', async ({ page }) => {
    const one = await pager(page, 'per-page="1"');
    await one.evaluate((c, data) => c.setData(data), rows(5));
    await expect(one).toHaveAttribute('page-count', '5');
    await expect(one.locator('label.per-page')).toBeHidden();
    const hidden = await pager(page, 'hide-per-page');
    await hidden.evaluate((c, data) => c.setData(data), rows(60));
    await expect(hidden).toHaveAttribute('page-count', '3');
    await expect(hidden.locator('label.per-page')).toBeHidden();
});
test('per-page-options replaces the offered sizes', async ({ page }) => {
    const el = await pager(page, 'per-page-options="15,30"');
    await el.evaluate((c, data) => c.setData(data), rows(60));
    await expect(el.locator('select option')).toHaveText(['15', '30']);
    // The default of 20 is not offered, so the first size is used.
    await expect(el).toHaveAttribute('page-count', '4');
});
test('the chosen page size is shared by every pagination, saved, and fires per-page', async ({ page }) => {
    const root = await mount(page, '<webui-pagination class="a"></webui-pagination><webui-pagination class="b"></webui-pagination><webui-pagination class="c" per-page="1"></webui-pagination>');
    const [a, b, c] = ['a', 'b', 'c'].map(n => root.locator(`webui-pagination.${n}`));
    for (const el of [a, b, c]) await el.evaluate((p, data) => p.setData(data), rows(120));
    await b.evaluate(el => { window.perPageEvents = []; el.addEventListener('per-page', ev => window.perPageEvents.push(ev.detail)); });
    await a.locator('select').selectOption('50');
    await expect.poll(() => b.evaluate(el => el.perPage)).toBe(50);
    await expect(b.locator('select')).toHaveValue('50');
    expect(await page.evaluate(() => window.perPageEvents)).toEqual([50]);
    // One item at a time keeps its own size.
    expect(await c.evaluate(el => el.perPage)).toBe(1);
    expect(await page.evaluate(() => webui.getData('session-pagination-per-page'))).toBe(50);
    // A new pagination starts with the saved size.
    const later = await mount(page, '<webui-pagination></webui-pagination>');
    await expect.poll(() => later.locator('webui-pagination').evaluate(el => el.perPage)).toBe(50);
});
test('a larger page size moves a page past the end back to the last page', async ({ page }) => {
    const el = await pager(page);
    await el.evaluate((c, data) => c.setData(data), rows(60));
    await el.locator('select').selectOption('10');
    await el.evaluate(c => c.setValue(5));
    await expect.poll(() => el.evaluate(c => c.page)).toBe(5);
    await el.locator('select').selectOption('50');
    await expect.poll(() => el.evaluate(c => c.page)).toBe(2);
});
test('the arrow buttons are named for screen readers', async ({ page }) => {
    await mount(page, '<webui-pagination></webui-pagination>');
    for (const name of ['First page', 'Previous page', 'Next page', 'Last page']) {
        await expect(page.getByRole('button', { name, includeHidden: true })).toHaveCount(1);
    }
});
