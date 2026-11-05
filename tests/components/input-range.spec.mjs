import { test, expect, mount } from '../support/webui.mjs';

test('value is kept regardless of attribute order', async ({ page }) => {
    const root = await mount(page, '<webui-input-range value="150" max="200"></webui-input-range>');
    const el = root.locator('webui-input-range');
    expect(await el.evaluate(c => c.value)).toBe('150');
    await expect(el).toHaveAttribute('value', '150');
    await expect(el.locator('span')).toHaveText('150');
});
test('min, max, step, label, and name reach the field', async ({ page }) => {
    const root = await mount(page, '<webui-input-range label="Size" min="1" max="5" step="0.5" name="s"></webui-input-range>');
    const el = root.locator('webui-input-range');
    await expect(el.locator('label')).toHaveText('Size');
    await expect(el.locator('input')).toHaveAttribute('min', '1');
    await expect(el.locator('input')).toHaveAttribute('max', '5');
    await expect(el.locator('input')).toHaveAttribute('step', '0.5');
    await expect(el.locator('input')).toHaveAttribute('name', 's');
});
test('moving the slider updates the value and fires one input event', async ({ page }) => {
    const root = await mount(page, '<webui-input-range data-trigger="ir-value"></webui-input-range>');
    const el = root.locator('webui-input-range');
    await el.evaluate(c => { window.__inputs = 0; c.addEventListener('input', () => window.__inputs++); });
    await el.locator('input').fill('30');
    expect(await page.evaluate(() => window.__inputs)).toBe(1);
    await expect(el.locator('span')).toHaveText('30');
    await expect.poll(() => page.evaluate(() => webui.getData('ir-value'))).toBe('30');
});
test('onrender formats the displayed value', async ({ page }) => {
    await page.evaluate(() => { window.showPercent = v => `${v}%`; });
    const root = await mount(page, '<webui-input-range onrender="showPercent" value="5"></webui-input-range>');
    await expect(root.locator('webui-input-range span')).toHaveText('5%');
});
test('an id moves to the field', async ({ page }) => {
    const root = await mount(page, '<webui-input-range id="x"></webui-input-range>');
    await expect(root.locator('input')).toHaveAttribute('id', 'x');
    expect(await root.locator('webui-input-range').getAttribute('id')).toBeNull();
});
test('it submits with forms, and data subscriptions set it', async ({ page }) => {
    const root = await mount(page, '<form><webui-input-range name="s" data-subscribe="ir-sub:setValue"></webui-input-range></form>');
    await root.locator('input').fill('30');
    expect(await root.locator('form').evaluate(f => new FormData(f).get('s'))).toBe('30');
    await page.evaluate(() => webui.setData('ir-sub', '12'));
    await expect(root.locator('input')).toHaveValue('12');
});
test('a value set from code is what the form submits', async ({ page }) => {
    const root = await mount(page, '<form><webui-input-range name="s"></webui-input-range></form>');
    await root.locator('webui-input-range').evaluate(c => { c.value = '12'; });
    expect(await root.locator('form').evaluate(f => new FormData(f).get('s'))).toBe('12');
});
