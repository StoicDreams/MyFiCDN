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
