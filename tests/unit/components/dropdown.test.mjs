import { test, expect, mount } from '../support/webui.mjs';

// webui-dropdown in jsdom: what needs layout or the mouse is in tests/browser/components/dropdown.spec.mjs.
test('removing start-icon, mid-icon, or end-icon clears it, rather than naming an icon "null"', async ({ page }) => {
    const root = await mount(page, '<webui-dropdown label="Pick" start-icon="gear" mid-icon="star" end-icon="xmark"></webui-dropdown>');
    const el = root.locator('webui-dropdown');
    await expect(el.locator('webui-icon.start')).toHaveAttribute('icon', 'gear');
    await el.evaluate(c => ['start-icon', 'mid-icon', 'end-icon'].forEach(a => c.removeAttribute(a)));
    for (const part of ['start', 'mid', 'end']) await expect(el.locator(`webui-icon.${part}`)).not.toHaveAttribute('icon');
});
test('removing api stops loading from it, and removing newid and newlabel drops the new option', async ({ page }) => {
    const calls = [];
    await page.route('**/dd-api**', route => { calls.push(route.request().url()); return route.fulfill({ contentType: 'application/json', body: '[{"value":"One"},{"value":"Two"}]' }); });
    const root = await mount(page, '<webui-dropdown label="Pick" api="get|http://localhost:3199/dd-api" newid="new" newlabel="Add new"></webui-dropdown>');
    const el = root.locator('webui-dropdown');
    await expect(el.locator('option')).toHaveText(['Add new', 'One', 'Two']);
    await el.evaluate(c => { c.removeAttribute('api'); c.removeAttribute('newid'); c.removeAttribute('newlabel'); c.setOptions(['Three']); });
    await expect(el.locator('option')).toHaveText(['Three']);
    expect(calls).toHaveLength(1);
    await expect.poll(() => el.evaluate(c => [c.apiUrl, c.apiMethod])).toEqual([undefined, 'GET']);
});
