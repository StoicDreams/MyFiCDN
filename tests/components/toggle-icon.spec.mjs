import { test, expect, mount } from '../support/webui.mjs';

test('clicking toggles the value, icon, and title', async ({ page }) => {
    const root = await mount(page, '<webui-toggle-icon title-on="On" title-off="Off" icon-on="bell|fill" icon-off="xmark"></webui-toggle-icon>');
    const el = root.locator('webui-toggle-icon');
    const icon = el.locator('webui-icon');
    await expect(icon).toHaveAttribute('icon', 'xmark');
    await expect(el.locator('button')).toHaveAttribute('aria-label', 'Off');
    await el.click();
    expect(await el.evaluate(c => c.value)).toBe(true);
    await expect(icon).toHaveAttribute('icon', 'bell|fill');
    await expect(el.locator('button')).toHaveAttribute('aria-label', 'On');
    await el.click();
    expect(await el.evaluate(c => c.value)).toBe(false);
});
test('uses default icons, and label displays', async ({ page }) => {
    const root = await mount(page, '<webui-toggle-icon label="Dark"></webui-toggle-icon>');
    const el = root.locator('webui-toggle-icon');
    await expect(el.locator('webui-icon')).toHaveAttribute('icon', 'toggle-off');
    await expect(el.locator('span')).toHaveText('Dark');
});
test('fires change, and writes to data-trigger', async ({ page }) => {
    const root = await mount(page, '<webui-toggle-icon data-trigger="ti-value"></webui-toggle-icon>');
    const el = root.locator('webui-toggle-icon');
    await el.evaluate(c => { window.__changes = 0; c.addEventListener('change', () => window.__changes++); });
    await el.click();
    expect(await page.evaluate(() => window.__changes)).toBeGreaterThan(0);
    await expect.poll(() => page.evaluate(() => webui.getData('ti-value'))).toBe(true);
});
test('setValue reads strings and booleans', async ({ page }) => {
    const root = await mount(page, '<webui-toggle-icon></webui-toggle-icon>');
    const el = root.locator('webui-toggle-icon');
    expect(await el.evaluate(c => {
        c.setValue('true');
        const a = c.value;
        c.setValue('false');
        const b = c.value;
        c.value = true;
        return [a, b, c.value];
    })).toEqual([true, false, true]);
});
test('theme-on and theme-off set the theme', async ({ page }) => {
    const root = await mount(page, '<webui-toggle-icon theme-on="success" theme-off="danger"></webui-toggle-icon>');
    const el = root.locator('webui-toggle-icon');
    await expect(el).toHaveAttribute('theme', 'danger');
    await el.click();
    await expect(el).toHaveAttribute('theme', 'success');
});
test('data-enabled follows another element', async ({ page }) => {
    const root = await mount(page, '<aside id="t"></aside><webui-toggle-icon data-enabled="#t" icon-on="bell" icon-off="xmark"></webui-toggle-icon>');
    const el = root.locator('webui-toggle-icon');
    await expect(el.locator('webui-icon')).toHaveAttribute('icon', 'xmark');
    await root.locator('#t').evaluate(t => { t.docked = true; });
    await el.click();
    await expect(el.locator('webui-icon')).toHaveAttribute('icon', 'bell');
});
test('a missing data-enabled target stops rechecking eventually', async ({ page }) => {
    const root = await mount(page, '<webui-toggle-icon data-enabled="#never"></webui-toggle-icon>');
    const el = root.locator('webui-toggle-icon');
    expect(await el.evaluate(c => { c._recheck = 20; c.updateElements(); return c._recheck; })).toBe(20);
});
test('the enabled attribute matches the value', async ({ page }) => {
    test.fail(true, 'Known bug: setValue removes the enabled attribute when true and sets it when false');
    const root = await mount(page, '<webui-toggle-icon></webui-toggle-icon>');
    const el = root.locator('webui-toggle-icon');
    await el.click();
    await expect(el).toHaveAttribute('enabled', { timeout: 500 });
});
