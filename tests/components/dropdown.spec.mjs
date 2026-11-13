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
// Plain options open the same list as html options, so tests pick from it.
const choose = async (el, name) => {
    await el.locator('button').click();
    await el.getByRole('option', { name, exact: true }).click();
};

test('data-name stores the whole selected item', async ({ page }) => {
    const el = await dropdown(page, `data-name="dd-item" options='[{"id":1,"display":"One"},{"id":2,"display":"Two"}]'`);
    await choose(el, 'Two');
    await expect.poll(() => page.evaluate(() => webui.getData('dd-item'))).toEqual({ id: 2, display: 'Two' });
});
test('multiple stores an array', async ({ page }) => {
    const el = await dropdown(page, `multiple data-name="dd-many" options="a,b"`);
    await choose(el, 'a');
    await el.getByRole('option', { name: 'b', exact: true }).click();
    await expect.poll(() => page.evaluate(() => webui.getData('dd-many').length)).toBe(2);
});
test('value and display read the selection', async ({ page }) => {
    const el = await dropdown(page, 'options="One|1,Two|2"');
    await choose(el, 'Two');
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
test('a load still waiting for its data-api data does not clear options from a newer load', async ({ page }) => {
    await page.route('**/dd-api**', route => route.fulfill({ contentType: 'application/json', body: '[{"value":"loaded"}]' }));
    // The first load waits for page-dd-filter with growing pauses. A second load starts during its last, longest pause.
    const el = await dropdown(page, 'api="get|http://localhost:3199/dd-api" data-api="page-dd-filter" data-fields="companyId"');
    await page.waitForTimeout(700);
    await page.evaluate(() => webui.setData('page-dd-filter', { companyId: 1 }));
    await el.evaluate(d => d.loadData());
    await expect(el.locator('option')).toHaveText(['loaded']);
    await page.waitForTimeout(1200);
    await expect(el.locator('option')).toHaveText(['loaded']);
});
test.describe('data-trigger when options load', () => {
    test('with no saved value, the option shown first is written', async ({ page }) => {
        await dropdown(page, 'data-subscribe="dd-trig-id" data-trigger="dd-trig-id|dd-trig-filter.id" options="One|1,Two|2"');
        await expect.poll(() => page.evaluate(() => webui.getData('dd-trig-id'))).toBe('1');
        expect(await page.evaluate(() => webui.getData('dd-trig-filter.id'))).toBe('1');
    });
    test('a single option from the api is written, so a dependent load can start', async ({ page }) => {
        await page.route('**/dd-api**', route => route.fulfill({ contentType: 'application/json', body: '[{"value":5,"display":"Only"}]' }));
        await dropdown(page, 'data-trigger="dd-trig-only" api="get|http://localhost:3199/dd-api"');
        await expect.poll(() => page.evaluate(() => webui.getData('dd-trig-only'))).toBe('5');
    });
    test('a saved value that is not among new options is replaced by the option shown', async ({ page }) => {
        await page.evaluate(() => webui.setData('dd-trig-old', 'gone'));
        const el = await dropdown(page, 'data-subscribe="dd-trig-old" data-trigger="dd-trig-old" options="a,b"');
        await expect.poll(() => page.evaluate(() => webui.getData('dd-trig-old'))).toBe('a');
        await page.evaluate(() => webui.setData('dd-trig-old', 'b'));
        await expect(el.locator('select')).toHaveValue('b');
        await el.evaluate(d => d.setOptions(['c', 'd']));
        await expect.poll(() => page.evaluate(() => webui.getData('dd-trig-old'))).toBe('c');
    });
    test('a saved value among the options is kept, with no change event', async ({ page }) => {
        await page.evaluate(() => webui.setData('dd-trig-keep', 'b'));
        const root = await mount(page, '<webui-dropdown data-subscribe="dd-trig-keep" data-trigger="dd-trig-keep"></webui-dropdown>');
        const el = root.locator('webui-dropdown');
        await el.evaluate(d => { window.__ddChanges = 0; d.addEventListener('change', () => ++window.__ddChanges); d.setOptions('a,b'); });
        await expect(el.locator('select')).toHaveValue('b');
        expect(await page.evaluate(() => [webui.getData('dd-trig-keep'), window.__ddChanges])).toEqual(['b', 0]);
    });
    test('without data-trigger or data-bind, loading options fires no change', async ({ page }) => {
        const el = await dropdown(page, '');
        await el.evaluate(d => { window.__ddChanges = 0; d.addEventListener('change', () => ++window.__ddChanges); d.setOptions('a,b'); });
        await expect(el.locator('select')).toHaveValue('a');
        expect(await page.evaluate(() => window.__ddChanges)).toBe(0);
    });
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

    test('shows a picker instead of the select', async ({ page }) => {
        const el = await htmlDropdown(page);
        await expect(el.locator('select')).toBeHidden();
        await expect(page.getByRole('combobox', { name: 'Color' })).toBeVisible();
        await expect(el.locator('button .picked b')).toHaveText('Red');
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

test('the disabled flag keeps the choice shown but stops it opening or taking focus', async ({ page }) => {
    const el = await dropdown(page, 'label="Off" disabled options="a,b"');
    const picker = page.getByRole('combobox', { name: 'Off' });
    await expect(picker).toHaveText('a');
    await expect(picker).toBeDisabled();
    await expect(el).toHaveAttribute('aria-disabled', 'true');
    await el.evaluate(d => d.openList());
    await expect(el.getByRole('option')).toHaveCount(0);
    await el.evaluate(d => d.removeAttribute('disabled'));
    await expect(picker).toBeEnabled();
    await expect(el).not.toHaveAttribute('aria-disabled');
    await choose(el, 'b');
    await expect(el.locator('select')).toHaveValue('b');
});
test.describe('plain options', () => {
    test('open the same styled list as html options, showing option text', async ({ page }) => {
        const root = await mount(page, `<webui-dropdown label="Plain" options='[{"id":"a","display":"A"},{"id":"b","html":"<b>Bee</b>"}]'></webui-dropdown>
<webui-dropdown html-options label="Fancy" options="A|a"></webui-dropdown>`);
        const plain = root.locator('webui-dropdown').first();
        const fancy = root.locator('webui-dropdown').last();
        await expect(plain.locator('select')).toBeHidden();
        await expect(page.getByRole('combobox', { name: 'Plain' })).toHaveText('A');
        // Both lists and options share one look: colors, font, and spacing.
        const look = async el => {
            await el.locator('button').click();
            const result = await el.locator('[role="option"]').first().evaluate(node => {
                const item = getComputedStyle(node);
                const list = getComputedStyle(node.parentElement);
                return [list.backgroundColor, list.color, item.fontSize, item.fontFamily, item.padding, node.getBoundingClientRect().height];
            });
            await page.keyboard.press('Escape');
            return result;
        };
        const plainLook = await look(plain);
        expect(plainLook[5]).toBeGreaterThan(0);
        expect(plainLook).toEqual(await look(fancy));
        await plain.locator('button').click();
        await expect(plain.getByRole('option')).toHaveText(['A', 'Bee']);
        await expect(plain.locator('[role="option"] b')).toHaveCount(0);
    });
    test('a pick from the list fires change and input on the dropdown', async ({ page }) => {
        const el = await dropdown(page, 'options="a,b"');
        await el.evaluate(d => {
            window.__events = [];
            d.addEventListener('change', _ => window.__events.push(`change:${d.value}`));
            d.addEventListener('input', _ => window.__events.push('input'));
        });
        await choose(el, 'b');
        await expect.poll(() => page.evaluate(() => window.__events)).toEqual(['input', 'change:b']);
    });
});
test.describe('on touch screens', () => {
    test.use({ hasTouch: true, isMobile: true });
    test('plain options keep the native select, while html options use the list', async ({ page }) => {
        expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
        const plain = await dropdown(page, 'options="a,b"');
        await expect(plain.locator('select')).toBeVisible();
        await expect(plain.locator('button')).toBeHidden();
        await plain.locator('select').selectOption('b');
        expect(await plain.evaluate(d => d.value)).toBe('b');
        const root = await mount(page, `<webui-dropdown html-options options="a,b"></webui-dropdown>`);
        await expect(root.locator('webui-dropdown button')).toBeVisible();
    });
});
