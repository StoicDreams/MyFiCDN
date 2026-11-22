import { test, expect, mount } from '../support/webui.mjs';

test('displays its name and icon and starts closed', async ({ page }) => {
    const root = await mount(page, '<webui-nav-group name="Tests" icon="xmark"></webui-nav-group>');
    const el = root.locator('webui-nav-group');
    await expect(el.locator('button.navlink span')).toHaveText('Tests');
    await expect(el.locator('button.navlink > webui-icon').first()).toHaveAttribute('icon', 'xmark');
    await expect.poll(() => el.evaluate(c => c.isOpen)).toBe(false);
});
test('clicking toggles it and fires change', async ({ page }) => {
    const root = await mount(page, '<webui-nav-group name="Tests"></webui-nav-group>');
    const el = root.locator('webui-nav-group');
    await el.evaluate(c => { window.__changes = 0; c.addEventListener('change', () => window.__changes++); });
    await el.locator('button.navlink').click();
    await expect.poll(() => el.evaluate(c => c.isOpen)).toBe(true);
    await el.locator('button.navlink').click();
    await expect.poll(() => el.evaluate(c => c.isOpen)).toBe(false);
    await expect.poll(() => page.evaluate(() => window.__changes)).toBe(2);
});
test('the show flag opens it, and disabled blocks clicks', async ({ page }) => {
    const root = await mount(page, '<webui-nav-group show name="A"></webui-nav-group><webui-nav-group class="disabled" name="B"></webui-nav-group>');
    await expect.poll(() => root.locator('webui-nav-group').first().evaluate(c => c.isOpen)).toBe(true);
    const disabled = root.locator('webui-nav-group').nth(1);
    await disabled.locator('button.navlink').click();
    await expect.poll(() => disabled.evaluate(c => c.isOpen)).toBe(false);
});
test('opens when the page shown is one of its links, and stays open when the page changes', async ({ page }) => {
    const root = await mount(page, '<webui-nav-group name="Help"><webui-nav-link url="/help/a" name="A"></webui-nav-link></webui-nav-group><webui-nav-group name="Other"><webui-nav-link url="/other" name="O"></webui-nav-link></webui-nav-group>');
    const help = root.locator('webui-nav-group').first();
    const other = root.locator('webui-nav-group').nth(1);
    await page.evaluate(() => webui.setData('page-path', '/help/a'));
    await expect.poll(() => help.evaluate(c => c.isOpen)).toBe(true);
    await expect.poll(() => other.evaluate(c => c.isOpen)).toBe(false);
    await page.evaluate(() => webui.setData('page-path', '/elsewhere'));
    await expect.poll(() => help.evaluate(c => c.isOpen)).toBe(true);
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
test('data-bind="key:setShow" opens the group from data and saves a person opening or closing it', async ({ page }) => {
    const root = await mount(page, '<webui-nav-group name="Tests" data-bind="nav-group-open:setShow"><webui-nav-link url="/x" name="X"></webui-nav-link></webui-nav-group>');
    const el = root.locator('webui-nav-group');
    await page.evaluate(() => webui.setData('nav-group-open', true));
    await expect.poll(() => el.evaluate(e => e.isOpen)).toBe(true);
    await root.getByRole('button', { name: 'Tests' }).click();
    await expect.poll(() => page.evaluate(() => webui.getData('nav-group-open'))).toBe(false);
});
test('bound text such as "false" keeps the group closed and the data as it was', async ({ page }) => {
    await page.evaluate(() => webui.setData('nav-group-text', 'false'));
    const root = await mount(page, '<webui-nav-group name="Tests" data-bind="nav-group-text:setShow"><webui-nav-link url="/x" name="X"></webui-nav-link></webui-nav-group>');
    const el = root.locator('webui-nav-group');
    await expect(el.locator('button.navlink')).toHaveAttribute('aria-expanded', 'false');
    expect(await page.evaluate(() => webui.getData('nav-group-text'))).toBe('false');
    await page.evaluate(() => webui.setData('nav-group-text', 'true'));
    await expect(el.locator('button.navlink')).toHaveAttribute('aria-expanded', 'true');
});
test('removing the icon removes it, rather than naming an icon "null"', async ({ page }) => {
    const root = await mount(page, '<webui-nav-group name="Tests" icon="xmark"></webui-nav-group>');
    const icon = root.locator('webui-nav-group button.navlink > webui-icon').first();
    await expect(icon).toHaveAttribute('icon', 'xmark');
    await root.locator('webui-nav-group').evaluate(c => c.removeAttribute('icon'));
    await expect(icon).not.toHaveAttribute('icon');
});
test('a bare disabled attribute keeps the group from opening', async ({ page }) => {
    const root = await mount(page, '<webui-nav-group name="Off" disabled><webui-nav-link name="A" url="/a"></webui-nav-link></webui-nav-group>');
    const el = root.locator('webui-nav-group');
    const button = el.getByRole('button', { name: 'Off' });
    await button.click();
    // Click handlers run during the click, so the group has already ignored it; the click after disabled is removed
    // goes the same way and shows clicks do reach it.
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await el.evaluate(g => g.removeAttribute('disabled'));
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
});
