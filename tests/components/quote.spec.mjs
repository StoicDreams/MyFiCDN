import { test, expect, mount } from '../support/webui.mjs';

test('displays the content and citation', async ({ page }) => {
    const root = await mount(page, '<webui-quote cite="Someone">Words</webui-quote>');
    const el = root.locator('webui-quote');
    await expect(el).toContainText('Words');
    await expect(el.locator('cite')).toHaveText('Someone');
});
test('hides the citation when there is none', async ({ page }) => {
    const root = await mount(page, '<webui-quote>Words</webui-quote>');
    await expect(root.locator('webui-quote cite')).toBeHidden();
});
test('theme sets the color', async ({ page }) => {
    const root = await mount(page, '<webui-quote theme="info">Words</webui-quote>');
    expect(await root.locator('webui-quote').evaluate(c => c.style.getPropertyValue('--theme-color'))).toBe('var(--color-info)');
});
