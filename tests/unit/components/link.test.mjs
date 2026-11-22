import { test, expect, mount } from '../support/webui.mjs';

test('icons go in their slots', async ({ page }) => {
    const root = await mount(page, '<webui-link icon="xmark" end-icon="arrow">x</webui-link>');
    await expect(root.locator('webui-link > [slot="start-icon"]')).toHaveAttribute('icon', 'xmark');
    await expect(root.locator('webui-link > [slot="end-icon"]')).toHaveAttribute('icon', 'arrow');
});
test('an internal href routes without a reload', async ({ page }) => {
    const root = await mount(page, '<webui-link href="/about">About</webui-link>');
    await root.locator('webui-link').click();
    await expect(page).toHaveURL(/\/about$/);
});
test('a target opens one new window and leaves this page alone', async ({ page }) => {
    const root = await mount(page, '<webui-link href="/about" target="_blank">About</webui-link>');
    const opened = await root.locator('webui-link').evaluate(el => {
        const calls = [];
        window.open = (...args) => calls.push(args);
        el.click();
        return calls;
    });
    expect(opened).toEqual([['/about', '_blank']]);
    await expect(page).toHaveURL(/__blank/);
});
test('a link is reached and followed with the keyboard, and named as a link', async ({ page }) => {
    const root = await mount(page, '<webui-link href="/about">About</webui-link>');
    const link = root.getByRole('link', { name: 'About' });
    await expect(link).toHaveAttribute('tabindex', '0');
    await link.focus();
    await link.press('Enter');
    await expect(page).toHaveURL(/\/about$/);
});
test('a link that only runs a trigger is a button, pressed with Space', async ({ page }) => {
    const root = await mount(page, '<webui-link onclick="window.__pressed = (window.__pressed || 0) + 1">Run</webui-link>');
    const button = root.getByRole('button', { name: 'Run' });
    await button.focus();
    await button.press(' ');
    await expect.poll(() => page.evaluate(() => window.__pressed)).toBe(1);
});
test('without an href or a trigger it is plain text, and a removed href takes the keyboard stop with it', async ({ page }) => {
    const root = await mount(page, '<webui-link href="/about">About</webui-link><webui-link id="plain">Plain</webui-link>');
    await expect(root.locator('#plain')).not.toHaveAttribute('tabindex');
    await expect(root.locator('#plain')).not.toHaveAttribute('role');
    await root.locator('webui-link').first().evaluate(el => el.removeAttribute('href'));
    await expect(root.locator('webui-link').first()).not.toHaveAttribute('tabindex');
    await expect(root.locator('webui-link').first()).not.toHaveAttribute('role');
});
