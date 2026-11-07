import { test, expect, mount } from '../support/webui.mjs';

test('displays its name and icon and starts closed', async ({ page }) => {
    const root = await mount(page, '<webui-nav-group name="Tests" icon="xmark"></webui-nav-group>');
    const el = root.locator('webui-nav-group');
    await expect(el.locator('button.navlink span')).toHaveText('Tests');
    await expect(el.locator('button.navlink > webui-icon').first()).toHaveAttribute('icon', 'xmark');
    expect(await el.evaluate(c => c.isOpen)).toBe(false);
});
test('clicking toggles it and fires change', async ({ page }) => {
    const root = await mount(page, '<webui-nav-group name="Tests"></webui-nav-group>');
    const el = root.locator('webui-nav-group');
    await el.evaluate(c => { window.__changes = 0; c.addEventListener('change', () => window.__changes++); });
    await el.locator('button.navlink').click();
    expect(await el.evaluate(c => c.isOpen)).toBe(true);
    await el.locator('button.navlink').click();
    expect(await el.evaluate(c => c.isOpen)).toBe(false);
    expect(await page.evaluate(() => window.__changes)).toBe(2);
});
test('the show flag opens it, and disabled blocks clicks', async ({ page }) => {
    const root = await mount(page, '<webui-nav-group show name="A"></webui-nav-group><webui-nav-group class="disabled" name="B"></webui-nav-group>');
    expect(await root.locator('webui-nav-group').first().evaluate(c => c.isOpen)).toBe(true);
    const disabled = root.locator('webui-nav-group').nth(1);
    await disabled.locator('button.navlink').click();
    expect(await disabled.evaluate(c => c.isOpen)).toBe(false);
});
test('changing the icon clears old flags', async ({ page }) => {
    const root = await mount(page, '<webui-nav-group name="A" icon="xmark|fill"></webui-nav-group>');
    const icon = root.locator('webui-nav-group button.navlink > webui-icon').first();
    await expect(icon).toHaveAttribute('fill', 'true');
    await root.locator('webui-nav-group').evaluate(c => c.setAttribute('icon', 'bell'));
    await expect(icon).toHaveAttribute('icon', 'bell');
    await expect(icon).not.toHaveAttribute('fill');
});
test('tells screen readers whether the group is open', async ({ page }) => {
    const root = await mount(page, '<webui-nav-group name="Tools"><a href="/a">A</a></webui-nav-group>');
    const button = root.locator('webui-nav-group button.navlink');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
});
