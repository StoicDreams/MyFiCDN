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
    await expect.poll(() => el.evaluate(c => c.value)).toBe('typed');
    await el.evaluate(c => { c.value = 'set'; });
    await expect(el.locator('textarea')).toHaveValue('set');
});
test('a missing value shows an empty field, not the text undefined', async ({ page }) => {
    const root = await mount(page, '<webui-input-message data-bind="note-text"></webui-input-message>');
    const el = root.locator('webui-input-message');
    await page.evaluate(() => webui.setData('note-text', 'kept'));
    await expect(el.locator('textarea')).toHaveValue('kept');
    await page.evaluate(() => webui.setData('note-text', undefined));
    await expect(el.locator('textarea')).toHaveValue('');
    await el.evaluate(c => c.setValue(null));
    await expect(el.locator('textarea')).toHaveValue('');
    await el.evaluate(c => c.setValue(12));
    await expect(el.locator('textarea')).toHaveValue('12');
});
test('it submits with forms', async ({ page }) => {
    const root = await mount(page, '<form><webui-input-message name="note"></webui-input-message></form>');
    await root.locator('textarea').fill('sent');
    await expect.poll(() => root.locator('form').evaluate(f => new FormData(f).get('note'))).toBe('sent');
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
    await expect.poll(() => field.evaluate(t => t.selectionStart)).toBe(3);
});
test('fires one input event per change', async ({ page }) => {
    const root = await mount(page, '<webui-input-message></webui-input-message>');
    const el = root.locator('webui-input-message');
    await el.evaluate(c => { window.__inputs = 0; c.addEventListener('input', () => window.__inputs++); });
    await el.locator('textarea').fill('x');
    await expect.poll(() => page.evaluate(() => window.__inputs)).toBe(1);
});
test('without a label, its title names the field', async ({ page }) => {
    await mount(page, '<webui-input-message title="Script"></webui-input-message>');
    await expect(page.getByRole('textbox', { name: 'Script' })).toHaveCount(1);
});
test('removing name, placeholder, or autofocus clears it from the field, rather than setting the text "null"', async ({ page }) => {
    const root = await mount(page, '<webui-input-message label="Note" name="n" placeholder="P" autofocus></webui-input-message>');
    const el = root.locator('webui-input-message');
    await expect(el.locator('textarea')).toHaveAttribute('placeholder', 'P');
    await el.evaluate(c => ['name', 'placeholder', 'autofocus'].forEach(a => c.removeAttribute(a)));
    for (const a of ['name', 'placeholder', 'autofocus']) await expect(el.locator('textarea')).not.toHaveAttribute(a);
});
test('an empty tab attribute indents with two spaces, and removing it goes back to a tab', async ({ page }) => {
    const root = await mount(page, '<webui-input-message label="Note" tab=""></webui-input-message>');
    const el = root.locator('webui-input-message');
    await expect(el.locator('textarea')).toHaveAttribute('tab', '  ');
    await el.evaluate(c => c.removeAttribute('tab'));
    await expect(el.locator('textarea')).not.toHaveAttribute('tab');
});
test('readonly keeps the text from being changed, Shift+Tab included', async ({ page }) => {
    const root = await mount(page, '<webui-input-message value="b" readonly></webui-input-message>');
    const el = root.locator('webui-input-message');
    await expect(el.locator('textarea')).not.toBeEditable();
    await el.locator('textarea').focus();
    await el.locator('textarea').press('Shift+Tab');
    await expect(el.locator('textarea')).toHaveValue('b');
    await el.evaluate(c => c.removeAttribute('readonly'));
    await expect(el.locator('textarea')).toBeEditable();
});
