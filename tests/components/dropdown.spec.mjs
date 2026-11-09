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
test('a template never reads option data as markup', async ({ page }) => {
    const root = await mount(page, `<webui-dropdown><template slot="template"><b>{NAME}</b></template></webui-dropdown>`);
    const el = root.locator('webui-dropdown');
    await el.evaluate(d => d.setOptions([{ id: 1, name: '<img src=q onerror="window.__xss=1">' }]));
    await expect(el.locator('option')).toHaveText('<img src=q onerror="window.__xss=1">');
    await expect(el.locator('option img, option b')).toHaveCount(0);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
});
test('the multiple flag lets the select pick several options', async ({ page }) => {
    const el = await dropdown(page, 'multiple options="a,b"');
    await expect.poll(() => el.locator('select').evaluate(s => s.multiple)).toBe(true);
});

test.describe('html-options', () => {
    const html = `[{"id":"r","html":"<webui-icon icon=\\"circle\\"></webui-icon> <b>Red</b>"},{"id":"g","html":"<i>Green</i>"},{"id":"b","display":"Blue & <co>"}]`;
    const htmlDropdown = (page, attributes = '') => dropdown(page, `html-options label="Color" data-name="dd-color" options='${html}' ${attributes}`);

    test('shows a picker instead of the select, keeping simple dropdowns native', async ({ page }) => {
        const el = await htmlDropdown(page);
        await expect(el.locator('select')).toBeHidden();
        await expect(page.getByRole('combobox', { name: 'Color' })).toBeVisible();
        await expect(el.locator('button .picked b')).toHaveText('Red');
        const plain = await dropdown(page, 'options="a,b"');
        await expect(plain.locator('select')).toBeVisible();
        await expect(plain.locator('button')).toBeHidden();
    });
    test('renders each item html, and escapes plain display text', async ({ page }) => {
        const el = await htmlDropdown(page);
        await el.locator('button').click();
        const options = page.getByRole('option');
        await expect(options).toHaveCount(3);
        await expect(el.locator('[role="option"] webui-icon')).toHaveCount(1);
        await expect(el.locator('[role="option"] i')).toHaveText('Green');
        await expect(options.nth(2)).toHaveText('Blue & <co>');
        await expect(el.locator('[role="option"] co')).toHaveCount(0);
        await expect(el.locator('option')).toHaveText(['Red', 'Green', 'Blue & <co>']);
    });
    test('clicking an option selects it, stores its data, and closes the list', async ({ page }) => {
        const el = await htmlDropdown(page);
        await el.locator('button').click();
        await expect(el.locator('button')).toHaveAttribute('aria-expanded', 'true');
        await page.getByRole('option', { name: 'Green' }).click();
        await expect(el.locator('[role="listbox"]')).toBeHidden();
        await expect(el.locator('button')).toHaveAttribute('aria-expanded', 'false');
        await expect(el.locator('button .picked i')).toHaveText('Green');
        expect(await el.evaluate(d => [d.value, d.display])).toEqual(['g', 'Green']);
        await expect.poll(() => page.evaluate(() => webui.getData('dd-color').id)).toBe('g');
    });
    test('the keyboard opens, moves through, and picks options', async ({ page }) => {
        const el = await htmlDropdown(page);
        await el.locator('button').focus();
        await page.keyboard.press('ArrowDown');
        await expect(el.locator('[role="listbox"]')).toBeVisible();
        await expect(el.locator('[role="option"].active')).toHaveText('Red');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await expect(el.locator('button')).toHaveAttribute('aria-activedescendant', 'option-2');
        await page.keyboard.press('Enter');
        await expect(el.locator('[role="listbox"]')).toBeHidden();
        await expect.poll(() => el.evaluate(d => d.value)).toBe('b');
        await page.keyboard.press('g');
        await expect.poll(() => el.evaluate(d => d.value)).toBe('g');
        await page.keyboard.press('Space');
        await page.keyboard.press('Escape');
        await expect(el.locator('[role="listbox"]')).toBeHidden();
        await expect(el.locator('button')).toBeFocused();
        expect(await el.evaluate(d => d.value)).toBe('g');
    });
    test('clicking outside closes the list without a change', async ({ page }) => {
        const el = await htmlDropdown(page);
        await el.locator('button').click();
        await expect(el.locator('[role="listbox"]')).toBeVisible();
        await page.mouse.click(5, 300);
        await expect(el.locator('[role="listbox"]')).toBeHidden();
        expect(await el.evaluate(d => d.value)).toBe('r');
    });
    test('setValue and the value attribute update the picker', async ({ page }) => {
        const el = await htmlDropdown(page, 'value="g"');
        await expect(el.locator('button .picked i')).toHaveText('Green');
        await el.evaluate(d => d.setValue('r'));
        await expect(el.locator('button .picked b')).toHaveText('Red');
        await expect(el.locator('[role="option"][aria-selected="true"]')).toHaveText('Red');
    });
    test('multiple toggles options and keeps the list open', async ({ page }) => {
        const el = await htmlDropdown(page, 'multiple');
        await el.locator('button').click();
        await page.getByRole('option', { name: 'Green' }).click();
        await expect(el.locator('[role="listbox"]')).toHaveAttribute('aria-multiselectable', 'true');
        await expect(el.locator('[role="listbox"]')).toBeVisible();
        await expect(el.locator('button .pick')).toHaveCount(2);
        await page.getByRole('option', { name: 'Red' }).click();
        await expect(el.locator('button .pick')).toHaveCount(1);
        await expect.poll(() => page.evaluate(() => webui.getData('dd-color').map(i => i.id))).toEqual(['g']);
    });
    test('a template with data-html reads option html from other fields', async ({ page }) => {
        const root = await mount(page, `<webui-dropdown html-options data-html="markup"><template slot="template"><u>{NAME}</u></template></webui-dropdown>`);
        const el = root.locator('webui-dropdown');
        await el.evaluate(d => d.setOptions([{ id: 1, name: 'A<s>' }, { id: 2, markup: '<em>Two</em>' }]));
        await expect(el.locator('[role="option"] u')).toHaveText('A<s>');
        await expect(el.locator('[role="option"] s')).toHaveCount(0);
        await expect(el.locator('[role="option"] em')).toHaveText('Two');
    });
    test('the picked option lays out as it does in the list, so content pinned right stays right', async ({ page }) => {
        const options = JSON.stringify([{ id: 'a', html: '<span>Alpha</span><span class="end" style="margin-left:auto">9</span>' }]);
        const root = await mount(page, `<div style="width:300px"><webui-dropdown html-options label="Pinned" options='${options}'></webui-dropdown></div>`);
        const el = root.locator('webui-dropdown');
        await expect(el.locator('button .end')).toHaveText('9');
        await el.locator('button').click();
        await expect(el.locator('[role="listbox"].open')).toBeVisible();
        const right = locator => locator.evaluate(node => node.getBoundingClientRect().right);
        const button = await right(el.locator('button'));
        const picked = await right(el.locator('button .end'));
        const listed = await right(el.locator('[role="option"] .end'));
        // Both sit at the right edge, give or take the padding of the picker and the list.
        expect(button - picked).toBeLessThan(20);
        expect(Math.abs(picked - listed)).toBeLessThan(20);
    });
    test('a multiple choice keeps each pick only as wide as its content', async ({ page }) => {
        const options = JSON.stringify([{ id: 'a', html: '<b>A</b>' }, { id: 'b', html: '<b>B</b>' }]);
        const root = await mount(page, `<div style="width:300px"><webui-dropdown html-options multiple label="Tags" options='${options}'></webui-dropdown></div>`);
        const el = root.locator('webui-dropdown');
        await el.evaluate(d => d.setValue('a'));
        await expect(el.locator('button .pick')).toHaveCount(1);
        expect(await el.locator('button .pick').evaluate(node => node.getBoundingClientRect().width)).toBeLessThan(60);
    });
    test('adding the flag later switches an existing dropdown to the picker', async ({ page }) => {
        const el = await dropdown(page, `options='[{"id":"x","html":"<b>X</b>"}]'`);
        await expect(el.locator('option')).toHaveText('X');
        await el.evaluate(d => d.setAttribute('html-options', ''));
        await expect(el.locator('button .picked b')).toHaveText('X');
        await expect(el.locator('label')).toHaveAttribute('for', /-picker$/);
    });
});
