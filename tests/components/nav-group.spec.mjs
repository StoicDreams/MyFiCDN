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
test('a closed group takes no room: the item after it follows at once, and its long names never widen the menu', async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 600 });
    const long = 'A very long page name that would make the menu very wide if it counted while hidden';
    const root = await mount(page, `<div style="display:flex;align-items:flex-start">
<webui-nav id="menu" style="display:inline-block">
<webui-nav-group name="Outer">
<webui-nav-group name="Inner"><webui-nav-link name="${long}" url="/x"></webui-nav-link><webui-nav-link name="Two" url="/y"></webui-nav-link></webui-nav-group>
<webui-nav-group name="Inner Two"><webui-nav-link name="Three" url="/z"></webui-nav-link></webui-nav-group>
</webui-nav-group>
<webui-nav-link id="after" name="After" url="/after"></webui-nav-link>
</webui-nav>
<button id="beside">Beside</button>
</div>`);
    const outer = root.locator('webui-nav-group[name="Outer"] > button.navlink');
    await expect(root.locator(`webui-nav-link[name="${long}"]`)).toBeHidden();
    // What a click just below the closed group reaches: the next item, with no gap left by what it holds.
    const box = await outer.boundingBox();
    await expect.poll(() => page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('webui-nav-link, webui-nav-group')?.getAttribute('name') ?? null, { x: box.x + 10, y: box.y + box.height + 6 })).toBe('After');
    // In a narrow window, what sits beside the menu stays in view, rather than pushed out by hidden long names.
    await expect(root.locator('#beside')).toBeInViewport();
    await outer.click();
    await expect(root.locator('webui-nav-group[name="Inner"] > button.navlink')).toBeVisible();
    await expect(root.locator(`webui-nav-link[name="${long}"]`)).toBeHidden();
});
