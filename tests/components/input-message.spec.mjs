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
test('shows a focus ring around the box while typing', async ({ page }) => {
    const root = await mount(page, '<webui-input-message label="Note"></webui-input-message>');
    const el = root.locator('webui-input-message');
    await el.locator('textarea').focus();
    // An accessibility rule, so the ring itself is checked (Websites/CLAUDE.md, What tests check).
    await expect.poll(() => el.evaluate(e => getComputedStyle(e).outlineWidth)).toBe('2px');
});
test('without a label, its title names the field', async ({ page }) => {
    await mount(page, '<webui-input-message title="Script"></webui-input-message>');
    await expect(page.getByRole('textbox', { name: 'Script' })).toHaveCount(1);
});
test('typed text stays readable on the box when the page uses a dark color scheme', async ({ page }) => {
    // A dark color-scheme turns a textarea's default text white, which can't be read on the box's light paper.
    // This checks the WCAG AA contrast of the typed text against the box, the accessibility check tests keep.
    const root = await mount(page, '<webui-input-message value="Commit message"></webui-input-message>');
    await page.evaluate(() => { document.documentElement.style.colorScheme = 'dark'; });
    const el = root.locator('webui-input-message');
    await expect(el.locator('textarea')).toHaveValue('Commit message');
    const ratio = await el.evaluate(host => {
        const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
        const luminance = ([r, g, b]) => [r, g, b].map(c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; })
            .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
        const text = luminance(rgb(getComputedStyle(host.shadowRoot.querySelector('textarea')).color));
        const box = luminance(rgb(getComputedStyle(host).backgroundColor));
        return (Math.max(text, box) + 0.05) / (Math.min(text, box) + 0.05);
    });
    expect(ratio).toBeGreaterThanOrEqual(4.5);
});
