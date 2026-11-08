import { test, expect, mount } from '../support/webui.mjs';

const input = async (page, attributes = '') => {
    const root = await mount(page, `<webui-input-text ${attributes}></webui-input-text>`);
    return root.locator('webui-input-text');
};

test('attributes reach the field', async ({ page }) => {
    const el = await input(page, 'label="Name" name="n" type="email" placeholder="P" maxlength="5" minlength="1" min="1" max="9" value="v"');
    await expect(el.locator('label')).toHaveText('Name');
    const field = el.locator('input');
    await expect(field).toHaveAttribute('name', 'n');
    await expect(field).toHaveAttribute('type', 'email');
    await expect(field).toHaveAttribute('placeholder', 'P');
    await expect(field).toHaveAttribute('maxlength', '5');
    await expect(field).toHaveValue('v');
});
test('type defaults to text, and an id moves to the field', async ({ page }) => {
    const el = await input(page, 'id="x"');
    await expect(el.locator('input')).toHaveAttribute('type', 'text');
    await expect(el.locator('input')).toHaveAttribute('id', 'x');
});
test('typing does not change ordinary text', async ({ page }) => {
    const field = (await input(page)).locator('input');
    for (const text of ['Tom & Jerry', 'a < b', '  lead', '"quoted"']) {
        await field.fill(text);
        await expect(field).toHaveValue(text);
    }
});
test('markup that could run scripts is removed', async ({ page }) => {
    const field = (await input(page)).locator('input');
    await field.fill('<img src=x onerror=alert(1)>');
    await expect(field).not.toHaveValue(/onerror/);
});
test('passwords are never changed', async ({ page }) => {
    const field = (await input(page, 'type="password"')).locator('input');
    await field.fill('p&ss<word> <img src=x onerror=1>');
    await expect(field).toHaveValue('p&ss<word> <img src=x onerror=1>');
});
test('number fields clamp to min and max', async ({ page }) => {
    const field = (await input(page, 'type="number" min="2" max="9"')).locator('input');
    await field.fill('50');
    await expect(field).toHaveValue('9');
    await field.fill('1');
    await field.blur();
    await expect(field).toHaveValue('2');
});
test('value and placeholder properties read and write', async ({ page }) => {
    const el = await input(page, 'placeholder="P"');
    expect(await el.evaluate(c => c.placeholder)).toBe('P');
    await el.evaluate(c => { c.placeholder = 'Q'; c.value = 'V'; });
    await expect(el.locator('input')).toHaveAttribute('placeholder', 'Q');
    await expect(el.locator('input')).toHaveValue('V');
    await el.evaluate(c => c.setValue('W'));
    await expect(el.locator('input')).toHaveValue('W');
});
test('fires one input event per change, and writes to data-trigger', async ({ page }) => {
    const el = await input(page, 'data-trigger="it-value"');
    await el.evaluate(c => { window.__inputs = 0; c.addEventListener('input', () => window.__inputs++); });
    await el.locator('input').fill('x');
    expect(await page.evaluate(() => window.__inputs)).toBe(1);
    expect(await page.evaluate(() => webui.getData('it-value'))).toBe('x');
});
test('Ctrl+Enter submits the form', async ({ page }) => {
    const root = await mount(page, '<form><webui-input-text name="q"></webui-input-text></form>');
    await root.locator('form').evaluate(f => {
        window.__submits = 0;
        f.addEventListener('submit', ev => { ev.preventDefault(); window.__submits++; });
    });
    await root.locator('input').press('Control+Enter');
    expect(await page.evaluate(() => window.__submits)).toBe(1);
});
test('the label names the field, and without one its title does', async ({ page }) => {
    const root = await mount(page, '<webui-input-text label="Project Name"></webui-input-text><webui-input-text title="Value of api_url"></webui-input-text>');
    await expect(page.getByRole('textbox', { name: 'Project Name' })).toHaveCount(1);
    await expect(page.getByRole('textbox', { name: 'Value of api_url' })).toHaveCount(1);
    await root.getByText('Project Name').click();
    await expect(page.getByRole('textbox', { name: 'Project Name' })).toBeFocused();
});
