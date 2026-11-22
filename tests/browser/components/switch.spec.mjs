import { test, expect, mount } from '../support/webui.mjs';

// jsdom never calls formDisabledCallback, so turning the switch off is tested in a real browser.
test('disabled shows the choice but keeps it from changing, until it is removed', async ({ page }) => {
    const root = await mount(page, '<webui-switch options="one|two" value="one" disabled></webui-switch>');
    const el = root.locator('webui-switch');
    const two = el.getByRole('radio', { name: 'two' });
    await expect(two).toBeDisabled();
    await expect(el.getByRole('radio', { name: 'one' })).toHaveAttribute('aria-checked', 'true');
    await el.evaluate(c => c.removeAttribute('disabled'));
    await expect(two).toBeEnabled();
    await two.click();
    await expect(two).toHaveAttribute('aria-checked', 'true');
});
