import { test, expect, mount } from '../support/webui.mjs';

test('shortens long strings at any depth and keeps other values', async ({ page }) => {
    const root = await mount(page, '<webui-json-condensed limit="3"></webui-json-condensed>');
    const el = root.locator('webui-json-condensed');
    await el.evaluate(c => c.setValue({ a: 'abcdef', b: [{ c: 'xyzxyz' }], d: 5, e: null, f: true }));
    await expect.poll(() => el.evaluate(c => c.condensed)).toEqual({ a: 'abc...', b: [{ c: 'xyz...' }], d: 5, e: null, f: true });
});
test('accepts json text, and empty values give an empty result', async ({ page }) => {
    const root = await mount(page, '<webui-json-condensed></webui-json-condensed>');
    const el = root.locator('webui-json-condensed');
    await el.evaluate(c => c.setValue('{"a":1}'));
    await expect.poll(() => el.evaluate(c => c.condensed)).toEqual({ a: 1 });
    await el.evaluate(c => c.setValue(null));
    await expect.poll(() => el.evaluate(c => c.condensed)).toBe('');
});
test('sends the result to data-trigger', async ({ page }) => {
    const root = await mount(page, '<webui-json-condensed data-trigger="jc-out" limit="1"></webui-json-condensed>');
    await root.locator('webui-json-condensed').evaluate(c => c.setValue({ a: 'xy' }));
    await expect.poll(() => page.evaluate(() => webui.getData('jc-out'))).toEqual({ a: 'x...' });
});
