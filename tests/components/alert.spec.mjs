import { test, expect, mount } from '../support/webui.mjs';

test('displays its message when show is set', async ({ page }) => {
    const root = await mount(page, '<webui-alert show variant="info">Hello</webui-alert>');
    await expect(root.locator('webui-alert')).toBeVisible();
    await expect(root.locator('webui-alert')).toHaveText('Hello');
});
test('stays hidden without show', async ({ page }) => {
    const root = await mount(page, '<webui-alert>Hello</webui-alert>');
    await expect(root.locator('webui-alert')).toBeHidden();
});
test('variant picks the icon shape and theme', async ({ page }) => {
    const root = await mount(page, '<webui-alert show variant="danger">x</webui-alert>');
    const alert = root.locator('webui-alert');
    await expect(alert.locator('#icon')).toHaveAttribute('shape', 'octogon');
    expect(await alert.evaluate(el => el.style.getPropertyValue('--theme-color'))).toBe('var(--color-danger)');
    await alert.evaluate(el => el.setAttribute('variant', 'success'));
    await expect(alert.locator('#icon')).toHaveAttribute('shape', 'circle');
});
test('the close button hides it and records that', async ({ page }) => {
    const root = await mount(page, '<webui-alert show>x</webui-alert>');
    const alert = root.locator('webui-alert');
    await alert.locator('#close').click();
    await expect(alert).not.toHaveAttribute('show');
    expect(await alert.evaluate(el => el.userclosed)).toBe(true);
});
test('fixed hides the close button', async ({ page }) => {
    const root = await mount(page, '<webui-alert show fixed>x</webui-alert>');
    await expect(root.locator('webui-alert #close')).toBeHidden();
});
test('setValue accepts text, json, and html, and a falsy value hides it', async ({ page }) => {
    const root = await mount(page, '<webui-alert></webui-alert>');
    const alert = root.locator('webui-alert');
    await alert.evaluate(el => el.setValue('plain', 'info'));
    await expect(alert).toHaveText('plain');
    await alert.evaluate(el => el.setValue('{"text":"from json"}'));
    await expect(alert).toHaveText('from json');
    await alert.evaluate(el => el.setValue({ html: '<b>bold</b>' }));
    await expect(alert.locator('b')).toHaveText('bold');
    await alert.evaluate(el => el.setValue(null));
    await expect(alert).not.toHaveAttribute('show');
});
test('display, hide, and increment update the alert', async ({ page }) => {
    const root = await mount(page, '<webui-alert>x</webui-alert>');
    const alert = root.locator('webui-alert');
    await alert.evaluate(el => { el.display(); el.increment(); });
    await expect(alert).toHaveAttribute('show', 'true');
    await expect(alert.locator('.counter')).toHaveText('2');
    await alert.evaluate(el => el.hide());
    await expect(alert).not.toHaveAttribute('show');
});
