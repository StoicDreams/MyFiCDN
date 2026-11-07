import { test, expect, mount } from '../support/webui.mjs';

test('value, label, placeholder, and name reach the textarea', async ({ page }) => {
    const root = await mount(page, '<webui-input-message value="hi" label="Note" placeholder="Type" name="note"></webui-input-message>');
    const el = root.locator('webui-input-message');
    await expect(el.locator('textarea')).toHaveValue('hi');
    await expect(el.locator('label')).toHaveText('Note');
    await expect(el.locator('textarea')).toHaveAttribute('placeholder', 'Type');
    await expect(el.locator('textarea')).toHaveAttribute('name', 'note');
});
test('typing updates value, and the value property updates the field', async ({ page }) => {
    const root = await mount(page, '<webui-input-message></webui-input-message>');
    const el = root.locator('webui-input-message');
    await el.locator('textarea').fill('typed');
    expect(await el.evaluate(c => c.value)).toBe('typed');
    await el.evaluate(c => { c.value = 'set'; });
    await expect(el.locator('textarea')).toHaveValue('set');
});
test('it submits with forms', async ({ page }) => {
    const root = await mount(page, '<form><webui-input-message name="note"></webui-input-message></form>');
    await root.locator('textarea').fill('sent');
    expect(await root.locator('form').evaluate(f => new FormData(f).get('note'))).toBe('sent');
});
test('sanitize removes scripts but keeps ordinary text', async ({ page }) => {
    const root = await mount(page, '<webui-input-message sanitize></webui-input-message>');
    const field = root.locator('textarea');
    await field.fill('Tom & Jerry < friends');
    await expect(field).toHaveValue('Tom & Jerry < friends');
    await field.fill('<img src=x onerror=alert(1)>');
    await expect(field).not.toHaveValue(/onerror/);
});
test('without sanitize text is left alone', async ({ page }) => {
    const root = await mount(page, '<webui-input-message></webui-input-message>');
    await root.locator('textarea').fill('<b onclick=x>');
    await expect(root.locator('textarea')).toHaveValue('<b onclick=x>');
});
test('shift tab inserts the tab text in place of the selection', async ({ page }) => {
    const root = await mount(page, '<webui-input-message tab="  "></webui-input-message>');
    const field = root.locator('textarea');
    await field.fill('abcd');
    await field.evaluate(t => t.setSelectionRange(1, 3));
    await field.press('Shift+Tab');
    await expect(field).toHaveValue('a  d');
    expect(await field.evaluate(t => t.selectionStart)).toBe(3);
});
test('fires one input event per change', async ({ page }) => {
    const root = await mount(page, '<webui-input-message></webui-input-message>');
    const el = root.locator('webui-input-message');
    await el.evaluate(c => { window.__inputs = 0; c.addEventListener('input', () => window.__inputs++); });
    await el.locator('textarea').fill('x');
    expect(await page.evaluate(() => window.__inputs)).toBe(1);
});
test('shows a focus ring around the box while typing', async ({ page }) => {
    const root = await mount(page, '<webui-input-message label="Note"></webui-input-message>');
    const el = root.locator('webui-input-message');
    await el.locator('textarea').focus();
    expect(await el.evaluate(e => getComputedStyle(e).outlineWidth)).toBe('2px');
});
