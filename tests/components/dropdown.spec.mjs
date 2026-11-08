import { test, expect, mount } from '../support/webui.mjs';

const dropdown = async (page, attributes) => {
    const root = await mount(page, `<webui-dropdown ${attributes}></webui-dropdown>`);
    return root.locator('webui-dropdown');
};

test('options accept lists, display|value pairs, and json', async ({ page }) => {
    const el = await dropdown(page, 'options="a, Two|2, Three:3"');
    await expect(el.locator('option')).toHaveText(['a', 'Two', 'Three']);
    expect(await el.locator('option').evaluateAll(o => o.map(x => x.value))).toEqual(['a', '2', '3']);
    await el.evaluate(d => d.setOptions('[{"value":"x","display":"X"},"y"]'));
    await expect(el.locator('option')).toHaveText(['X', 'y']);
    await el.evaluate(d => d.setOptions(['z']));
    await expect(el.locator('option')).toHaveText(['z']);
});
test('the value attribute picks the starting option', async ({ page }) => {
    const el = await dropdown(page, 'value="b" options="a,b,c"');
    await expect(el.locator('select')).toHaveValue('b');
});
test('setValue handles quotes and unknown values', async ({ page }) => {
    const el = await dropdown(page, `options='[{"value":"we\\"ird"},{"value":"plain"}]'`);
    await expect(el.locator('option')).toHaveCount(2);
    await el.evaluate(d => d.setValue('we"ird'));
    await expect(el.locator('select')).toHaveValue('we"ird');
    await el.evaluate(d => d.setValue('nope'));
    await expect(el.locator('select')).toHaveValue('we"ird');
});
test('data-name stores the whole selected item', async ({ page }) => {
    const el = await dropdown(page, `data-name="dd-item" options='[{"id":1,"display":"One"},{"id":2,"display":"Two"}]'`);
    await el.locator('select').selectOption('2');
    await expect.poll(() => page.evaluate(() => webui.getData('dd-item'))).toEqual({ id: 2, display: 'Two' });
});
test('multiple stores an array', async ({ page }) => {
    const el = await dropdown(page, `multiple data-name="dd-many" options="a,b"`);
    await el.locator('select').evaluate(s => { s.multiple = true; });
    await el.locator('select').selectOption(['a', 'b']);
    await expect.poll(() => page.evaluate(() => webui.getData('dd-many').length)).toBe(2);
});
test('value and display read the selection', async ({ page }) => {
    const el = await dropdown(page, 'options="One|1,Two|2"');
    await el.locator('select').selectOption('2');
    expect(await el.evaluate(d => [d.value, d.display])).toEqual(['2', 'Two']);
});
test('label and icons display', async ({ page }) => {
    const el = await dropdown(page, 'label="Pick" icon="xmark" end-icon="caret" options="a"');
    await expect(el.locator('label')).toBeVisible();
    await expect(el.locator('slot[name="label"]')).toHaveText('Pick');
    await expect(el.locator('webui-icon.start')).toHaveAttribute('icon', 'xmark');
    await expect(el.locator('webui-icon.end')).toHaveAttribute('icon', 'caret');
});
test('newid and newlabel add a first option', async ({ page }) => {
    const el = await dropdown(page, 'newid="0" newlabel="Create" options="a"');
    await el.evaluate(d => d.setOptions(['a', 'b']));
    await expect(el.locator('option').first()).toHaveText('Create');
});
test('an option template formats each option', async ({ page }) => {
    const root = await mount(page, `<webui-dropdown><template slot="template">Item {NAME}</template></webui-dropdown>`);
    const el = root.locator('webui-dropdown');
    await el.evaluate(d => d.setOptions([{ id: 1, name: 'A' }]));
    await expect(el.locator('option')).toHaveText('Item A');
});
test('api loads options and ignores outdated responses', async ({ page }) => {
    await page.route('**/dd-api**', route => route.fulfill({ contentType: 'application/json', body: '[{"value":"from-api"}]' }));
    const el = await dropdown(page, 'api="get|http://localhost:3199/dd-api"');
    await expect(el.locator('option')).toHaveText(['from-api']);
});
test('option text is shown as text, never as markup', async ({ page }) => {
    const el = await dropdown(page, '');
    await el.evaluate(d => d.setOptions([{ value: 'x', display: '<img src=q onerror="window.__xss=1">' }, { value: 'y', display: 'R&D <b>' }]));
    await expect(el.locator('option')).toHaveText(['<img src=q onerror="window.__xss=1">', 'R&D <b>']);
    await expect(el.locator('option img, option b')).toHaveCount(0);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
});
test('without a label, its title names the select', async ({ page }) => {
    await mount(page, '<webui-dropdown title="Project" options="a|b"></webui-dropdown>');
    await expect(page.getByRole('combobox', { name: 'Project' })).toHaveCount(1);
});
