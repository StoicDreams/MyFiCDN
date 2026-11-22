import { test, expect, mount } from '../support/webui.mjs';

const show = async (page, attributes) => {
    const root = await mount(page, `<webui-condition ${attributes}><template slot="valid">VALID</template><template slot="invalid">INVALID</template></webui-condition>`);
    return root.locator('webui-condition');
};
const shows = async (page, attributes, text) => {
    const el = await show(page, attributes);
    await expect(el).toHaveText(text);
};

test('a subscribed value picks valid or invalid content', async ({ page }) => {
    const el = await show(page, 'data-subscribe="cond-a"');
    await expect(el).toHaveText('INVALID');
    await page.evaluate(() => webui.setData('cond-a', 'yes'));
    await expect(el).toHaveText('VALID');
    await page.evaluate(() => webui.setData('cond-a', ''));
    await expect(el).toHaveText('INVALID');
});
test('data-bind picks valid or invalid content the same as data-subscribe, ignoring a method name', async ({ page }) => {
    const el = await show(page, 'data-bind="cond-bound : setValue"');
    await expect(el).toHaveText('INVALID');
    await page.evaluate(() => webui.setData('cond-bound', 'yes'));
    await expect(el).toHaveText('VALID');
});
for (const value of ['0', 'false', 'null', 'undefined', '[]', '{}', '{TEMPLATE_X}']) {
    test(`the value ${value} counts as invalid`, async ({ page }) => {
        const el = await show(page, `data-value="${value}"`);
        await expect(el).toHaveText('INVALID');
    });
}
test('value is readable and settable', async ({ page }) => {
    const el = await show(page, 'data-value="abc"');
    await expect(el).toHaveText('VALID');
    await expect.poll(() => el.evaluate(c => c.value)).toBe('abc');
    await el.evaluate(c => { c.value = 'false'; });
    await expect(el).toHaveText('INVALID');
});
test('data-equals and data-unequals compare values', async ({ page }) => {
    await shows(page, 'data-value="a" data-equals="a"', 'VALID');
    await shows(page, 'data-value="a" data-equals="b"', 'INVALID');
    await shows(page, 'data-value="a" data-unequals="b"', 'VALID');
    await shows(page, 'data-value="a" data-unequals="a"', 'INVALID');
});
test('data-contains checks for text', async ({ page }) => {
    await shows(page, 'data-value="hello" data-contains="ell"', 'VALID');
    await shows(page, 'data-value="hello" data-contains="xyz"', 'INVALID');
});
test('data-match tests a pattern', async ({ page }) => {
    await shows(page, 'data-value="abc" data-match="^ab"', 'VALID');
    await shows(page, 'data-value="xyz" data-match="^ab"', 'INVALID');
});
test('data-ignore-case applies to every comparison', async ({ page }) => {
    await shows(page, 'data-value="ABC" data-equals="abc" data-ignore-case', 'VALID');
    await shows(page, 'data-value="abc" data-equals="ABC" data-ignore-case', 'VALID');
    await shows(page, 'data-value="ABC" data-match="^ab" data-ignore-case', 'VALID');
});
test('templates can display the subscribed value', async ({ page }) => {
    const root = await mount(page, `<webui-condition data-subscribe="cond-b:setValue">
<template slot="valid">{TEMPLATE_COND_B} is Valid!</template>
<template slot="invalid">{TEMPLATE_COND_B} is not Valid!</template></webui-condition>`);
    const el = root.locator('webui-condition');
    await expect(el).toHaveText('is not Valid!');
    await page.evaluate(() => webui.setData('cond-b', 'aaa'));
    await expect(el).toHaveText('aaa is Valid!');
});
test('the value still arrives when the component loads slowly', async ({ page }) => {
    // The component's script is held until the page has asked for it and handled the element without it.
    let release, asked;
    const held = new Promise(resolve => { release = resolve; });
    const requested = new Promise(resolve => { asked = resolve; });
    await page.route('**/webui/condition.*', async route => {
        asked();
        await held;
        await route.fallback();
    });
    const mounted = mount(page, '<webui-condition data-subscribe="cond-c:setValue"><template slot="invalid">{TEMPLATE_COND_C}none</template></webui-condition>');
    await requested;
    await expect(page.locator('#test-root webui-condition')).toBeAttached();
    release();
    const root = await mounted;
    await expect(root.locator('webui-condition')).toHaveText('none');
});
test('templates without a slot count as valid', async ({ page }) => {
    const root = await mount(page, '<webui-condition data-value="a"><template>PLAIN</template></webui-condition>');
    await expect(root.locator('webui-condition')).toHaveText('PLAIN');
});
test('unchanged output keeps the existing nodes', async ({ page }) => {
    const el = await show(page, 'data-value="a"');
    await expect(el).toHaveText('VALID');
    // checkConditions is synchronous, so the nodes are final when this returns.
    const kept = await el.evaluate(c => {
        const first = c.firstChild === null ? null : [...c.childNodes].find(n => n.nodeType === 3);
        c.checkConditions();
        return [...c.childNodes].includes(first);
    });
    expect(kept).toBe(true);
});

