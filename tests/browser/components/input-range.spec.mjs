import { test, expect, mount } from '../support/webui.mjs';

test('disabled turns the slider off, also while readonly is removed, until both are gone', async ({ page }) => {
    const root = await mount(page, '<webui-input-range value="5" disabled readonly></webui-input-range>');
    const el = root.locator('webui-input-range');
    await expect(el.locator('input')).toBeDisabled();
    await el.evaluate(c => c.removeAttribute('readonly'));
    await expect(el.locator('input')).toBeDisabled();
    await el.evaluate(c => c.removeAttribute('disabled'));
    await expect(el.locator('input')).toBeEnabled();
});
