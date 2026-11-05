import { test, expect, mount } from '../support/webui.mjs';

const table = async (page, attributes, inner = '') => {
    const root = await mount(page, `<webui-table ${attributes}>${inner}</webui-table>`);
    return root.locator('webui-table');
};

test('renders columns and rows, keeping text as text', async ({ page }) => {
    const el = await table(page, 'columns="Name;Age"');
    await el.evaluate(c => c.setData([{ Name: '<b>A</b>', Age: 3 }, { Name: 'B', Age: 4 }]));
    await expect(el.locator('th')).toHaveText(['Name', 'Age']);
    await expect(el.locator('tr')).toHaveCount(3);
    await expect(el.locator('tr').nth(1).locator('td')).toHaveText(['<b>A</b>', '3']);
    await expect(el.locator('td b')).toHaveCount(0);
});
test('html format renders markup', async ({ page }) => {
    const el = await table(page, 'columns="Name" column-formats="Name:html"');
    await el.evaluate(c => c.setData([{ Name: '<b>A</b>' }]));
    await expect(el.locator('td b')).toHaveText('A');
});
test('display names and alignment parse from the columns', async ({ page }) => {
    const el = await table(page, 'columns=":Full Name:|name;Age:|age;:Left|left"');
    await el.evaluate(c => c.setData([{ name: 'A', age: 1, left: 'x' }]));
    await expect(el.locator('th')).toHaveText(['Full Name', 'Age', 'Left']);
    await expect(el.locator('th').first()).toHaveClass('text-center');
    await expect(el.locator('td').nth(1)).toHaveClass('text-right');
    await expect(el.locator('td').nth(2)).toHaveClass('text-left');
    await expect(el.locator('td')).toHaveText(['A', '1', 'x']);
});
test('keys match in camel and pascal case', async ({ page }) => {
    const el = await table(page, 'columns="first-name;last-name"');
    await el.evaluate(c => c.setData([{ firstName: 'A', LastName: 'B' }]));
    await expect(el.locator('td')).toHaveText(['A', 'B']);
});
test('column templates format cells', async ({ page }) => {
    const el = await table(page, 'columns="Name" column-formats="Name:html"', '<template slot="column" name="Name"><i>{NAME}!</i></template>');
    await el.evaluate(c => c.setData([{ Name: 'A' }]));
    await expect(el.locator('td i')).toHaveText('A!');
});
test('json text and data subscriptions work', async ({ page }) => {
    await page.evaluate(() => webui.setData('tb-rows', [{ Name: 'Sub' }]));
    const el = await table(page, 'columns="Name" data-subscribe="tb-rows:setData"');
    await expect(el.locator('td')).toHaveText('Sub');
    await el.evaluate(c => c.setData('[{"Name":"Json"}]'));
    await expect(el.locator('td')).toHaveText('Json');
});
test('sortable headers toggle direction and fire update-sort', async ({ page }) => {
    const el = await table(page, 'columns="Name;Age" sortable="Name"');
    await el.evaluate(c => {
        window.__sorts = [];
        c.addEventListener('update-sort', () => window.__sorts.push([c.currentSort, c.currentSortDir]));
    });
    const header = el.locator('th webui-flex');
    await expect(header.locator('webui-icon')).toHaveAttribute('icon', /rotate:0/);
    await header.click();
    await el.locator('th webui-flex').click();
    expect(await page.evaluate(() => window.__sorts)).toEqual([['Name', 'desc'], ['Name', 'asc']]);
    await expect(el).toHaveAttribute('current-sort-dir', 'asc');
});
test('bordered toggles the class', async ({ page }) => {
    const el = await table(page, 'bordered columns="A"');
    await expect(el.locator('table')).toHaveClass('bordered');
    await el.evaluate(c => c.removeAttribute('bordered'));
    await expect(el.locator('table')).not.toHaveClass('bordered');
});
test('each row is stored as page data', async ({ page }) => {
    const el = await table(page, 'columns="A"');
    await el.evaluate(c => c.setData([{ A: 1 }]));
    expect(await el.evaluate(c => webui.getData(`page-tr-${c._data[0]._rowId}`).A)).toBe(1);
});
test('a large table renders quickly as one insert', async ({ page }) => {
    const el = await table(page, 'columns="A;B;C;D"');
    await expect(el.locator('tr')).toHaveCount(1);
    const elapsed = await el.evaluate(async c => {
        const rows = Array.from({ length: 500 }, (_, i) => ({ A: i, B: 'b', C: 'c', D: 'd' }));
        const start = performance.now();
        c.setData(rows);
        await webui.wait(0);
        return performance.now() - start;
    });
    await expect(el.locator('tr')).toHaveCount(501);
    expect(elapsed).toBeLessThan(1500);
});
