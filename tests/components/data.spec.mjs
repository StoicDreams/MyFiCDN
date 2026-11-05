import { test, expect, mount } from '../support/webui.mjs';

test('templates and data attributes become data', async ({ page }) => {
    await mount(page, `<webui-data data-page-thing="plain" data-page-json='{"a":1}'>
<template slot="json" name="d-json">{"b":2}</template>
<template slot="html" name="d-html"><b>x</b></template>
<template slot="text" name="d-text">  words </template></webui-data>`);
    await expect.poll(() => page.evaluate(() => webui.getData('d-json'))).toEqual({ b: 2 });
    expect(await page.evaluate(() => [webui.getData('page-thing'), webui.getData('page-json'), webui.getData('d-html'), webui.getData('d-text')])).toEqual(['plain', { a: 1 }, '<b>x</b>', 'words']);
});
test('existing data is not replaced by templates', async ({ page }) => {
    await page.evaluate(() => webui.setData('d-keep', 'first'));
    await mount(page, '<webui-data data-marker="1"><template slot="text" name="d-keep">second</template></webui-data>');
    await expect.poll(() => page.evaluate(() => webui.getData('marker'))).toBe(1);
    expect(await page.evaluate(() => webui.getData('d-keep'))).toBe('first');
});
test('subscribe, trigger, and click attributes are not stored as data', async ({ page }) => {
    await mount(page, '<webui-data data-trigger="t" data-click="c" data-marker="1"></webui-data>');
    await expect.poll(() => page.evaluate(() => webui.getData('marker'))).toBe(1);
    expect(await page.evaluate(() => [webui.getData('trigger'), webui.getData('click')])).toEqual([undefined, undefined]);
});
test('pushItem adds to the configured list', async ({ page }) => {
    await page.evaluate(() => webui.setData('d-list', [1]));
    const root = await mount(page, '<webui-data><template slot="json" data-update="d-list" name="d-unused">[]</template></webui-data>');
    await root.locator('webui-data').evaluate(el => el.pushItem(2, 'd-item'));
    expect(await page.evaluate(() => webui.getData('d-list'))).toEqual([1, 2]);
});
test('setDefault restores a template when data is cleared', async ({ page }) => {
    const root = await mount(page, '<webui-data><template slot="text" name="d-def">fallback</template></webui-data>');
    const el = root.locator('webui-data');
    await expect.poll(() => page.evaluate(() => webui.getData('d-def'))).toBe('fallback');
    await page.evaluate(() => webui.setData('d-def', undefined));
    await el.evaluate(c => c.setDefault(undefined, 'd-def'));
    expect(await page.evaluate(() => webui.getData('d-def'))).toBe('fallback');
});
