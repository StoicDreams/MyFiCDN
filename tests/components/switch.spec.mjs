import { test, expect, mount } from '../support/webui.mjs';

const buttons = root => root.locator('webui-switch [role="radio"]');
const checked = root => root.locator('webui-switch [aria-checked="true"]');

test('shows each option, with the first selected', async ({ page }) => {
    const root = await mount(page, '<webui-switch options="one|two|line break"></webui-switch>');
    await expect(buttons(root)).toHaveText(['one', 'two', 'line break']);
    await expect(checked(root)).toHaveText('one');
    expect(await root.locator('webui-switch').evaluate(el => el.value)).toBe('one');
});
test('the value attribute picks the option', async ({ page }) => {
    const root = await mount(page, '<webui-switch value="two" options="one|two|three"></webui-switch>');
    await expect(checked(root)).toHaveText('two');
});
test('clicking an option selects it and fires input and change', async ({ page }) => {
    const root = await mount(page, '<webui-switch options="one|two|three"></webui-switch>');
    const el = root.locator('webui-switch');
    await el.evaluate(c => {
        window.__events = [];
        c.addEventListener('input', () => window.__events.push('input'));
        c.addEventListener('change', () => window.__events.push(`change:${c.value}`));
    });
    await buttons(root).nth(2).click();
    await expect(checked(root)).toHaveText('three');
    await buttons(root).nth(2).click();
    expect(await page.evaluate(() => window.__events)).toEqual(['input', 'change:three']);
});
test('setValue selects without firing change, and an unknown value falls back to the first option', async ({ page }) => {
    const root = await mount(page, '<webui-switch options="one|two"></webui-switch>');
    const el = root.locator('webui-switch');
    const result = await el.evaluate(c => {
        let changes = 0;
        c.addEventListener('change', () => changes++);
        c.setValue('two');
        const set = c.value;
        c.value = 'missing';
        return [set, c.value, changes];
    });
    expect(result).toEqual(['two', 'one', 0]);
});
test('setOptions takes an array, and keeps a value that is still offered', async ({ page }) => {
    const root = await mount(page, '<webui-switch options="a|b"></webui-switch>');
    const el = root.locator('webui-switch');
    await el.evaluate(c => { c.value = 'b'; c.setOptions(['x', 'b', 'y']); });
    await expect(buttons(root)).toHaveText(['x', 'b', 'y']);
    await expect(checked(root)).toHaveText('b');
});
test('arrow keys move the selection, and only the selected option is a tab stop', async ({ page }) => {
    const root = await mount(page, '<button id="before">Before</button><webui-switch label="Size" options="small|medium|large"></webui-switch>');
    await root.locator('#before').focus();
    await page.keyboard.press('Tab');
    await expect(buttons(root).nth(0)).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(checked(root)).toHaveText('medium');
    await expect(buttons(root).nth(1)).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(checked(root)).toHaveText('large');
    await page.keyboard.press('Home');
    await expect(checked(root)).toHaveText('small');
    expect(await buttons(root).evaluateAll(list => list.map(b => b.tabIndex))).toEqual([0, -1, -1]);
    await expect(root.locator('webui-switch [role="radiogroup"]')).toHaveAttribute('aria-label', 'Size');
});
test('data-bind keeps the switch and data in step', async ({ page }) => {
    const root = await mount(page, '<webui-switch data-bind="switch-kind" options="one|two|three"></webui-switch>');
    await page.evaluate(() => webui.setData('switch-kind', 'three'));
    await expect(checked(root)).toHaveText('three');
    await buttons(root).nth(1).click();
    await expect.poll(() => page.evaluate(() => webui.getData('switch-kind'))).toBe('two');
});
test('its value is sent with a form', async ({ page }) => {
    const root = await mount(page, '<form><webui-switch name="kind" options="one|two"></webui-switch></form>');
    await buttons(root).nth(1).click();
    expect(await root.locator('form').evaluate(form => new FormData(form).get('kind'))).toBe('two');
});
