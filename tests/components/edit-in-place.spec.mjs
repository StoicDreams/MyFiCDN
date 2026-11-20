import { test, expect, mount } from '../support/webui.mjs';

const EDIT = '<webui-edit-in-place id="e" value="Repo" label="Project name" edit-title="Rename the project" required="Project name cannot be empty."></webui-edit-in-place>';
const text = el => el.locator('.edit-text');
const field = el => el.locator('webui-input-text.edit-field input');
// webui-button copies its class onto its own slots, so the element is named too.
const button = (el, name) => el.locator(`webui-button.edit-${name}`);

async function editor(page, html = EDIT) {
    const root = await mount(page, html);
    const el = root.locator('#e');
    await page.evaluate(() => {
        window.__events = [];
        const node = document.querySelector('#e');
        ['save', 'change', 'cancel'].forEach(type => node.addEventListener(type, ev => window.__events.push([type, ev.detail?.value ?? null])));
    });
    return el;
}
const events = page => page.evaluate(() => window.__events);

test('shows the text as a button named for what it edits', async ({ page }) => {
    const el = await editor(page);
    await expect(text(el)).toHaveText('Repo');
    await expect(text(el)).toHaveAttribute('title', 'Rename the project');
    await expect(el.getByRole('button', { name: 'Repo' })).toBeVisible();
    await expect(el.locator('.edit-form')).toBeHidden();
});

test('clicking opens a field with the text chosen, and Save sends it and shows the new text', async ({ page }) => {
    const el = await editor(page);
    await text(el).click();
    await expect(el).toHaveAttribute('editing', '');
    await expect(field(el)).toBeFocused();
    await expect(field(el)).toHaveValue('Repo');
    await expect(field(el)).toHaveAttribute('aria-label', 'Project name');
    await field(el).fill('  Website  ');
    await button(el, 'save').click();
    await expect(text(el)).toHaveText('Website');
    await expect(el).toHaveAttribute('value', 'Website');
    await expect(el).not.toHaveAttribute('editing');
    await expect(text(el)).toBeFocused();
    await expect.poll(() => events(page)).toEqual([['save', 'Website'], ['change', 'Website']]);
});

test('Enter saves and Escape cancels, leaving the text as it was', async ({ page }) => {
    const el = await editor(page);
    await text(el).click();
    await field(el).fill('Typed');
    await field(el).press('Escape');
    await expect(text(el)).toHaveText('Repo');
    await expect(el.locator('.edit-form')).toBeHidden();
    await text(el).click();
    await expect(field(el)).toHaveValue('Repo');
    await field(el).fill('Entered');
    await field(el).press('Enter');
    await expect(text(el)).toHaveText('Entered');
    await expect.poll(() => events(page)).toEqual([['cancel', null], ['save', 'Entered'], ['change', 'Entered']]);
});

test('Cancel closes the field without saving', async ({ page }) => {
    const el = await editor(page);
    await text(el).click();
    await field(el).fill('Not this');
    await button(el, 'cancel').click();
    await expect(text(el)).toHaveText('Repo');
    await expect.poll(() => events(page)).toEqual([['cancel', null]]);
});

test('the same text closes the field without a save', async ({ page }) => {
    const el = await editor(page);
    await text(el).click();
    await button(el, 'save').click();
    await expect(el.locator('.edit-form')).toBeHidden();
    await expect(text(el)).toBeFocused();
    await expect.poll(() => events(page)).toEqual([]);
});

test('with required, blank text is refused with its message and the field stays open', async ({ page }) => {
    const el = await editor(page);
    await page.evaluate(() => { window.__alerts = []; webui.alert = (message, theme) => window.__alerts.push([message, theme]); });
    await text(el).click();
    await field(el).fill('   ');
    await button(el, 'save').click();
    await expect.poll(() => page.evaluate(() => window.__alerts)).toEqual([['Project name cannot be empty.', 'warning']]);
    await expect(el).toHaveAttribute('editing', '');
    await expect.poll(() => events(page)).toEqual([]);
});

test('without required, blank text is saved', async ({ page }) => {
    const el = await editor(page, '<webui-edit-in-place id="e" value="Note"></webui-edit-in-place>');
    await text(el).click();
    await field(el).fill('');
    await button(el, 'save').click();
    await expect(el).toHaveAttribute('value', '');
});

test('a page that refuses the save keeps the field open with what was typed', async ({ page }) => {
    const el = await editor(page);
    await page.evaluate(() => document.querySelector('#e').addEventListener('save', ev => ev.preventDefault()));
    await text(el).click();
    await field(el).fill('Taken');
    await button(el, 'save').click();
    await expect.poll(() => events(page)).toEqual([['save', 'Taken']]);
    await expect(el).toHaveAttribute('editing', '');
    await expect(field(el)).toHaveValue('Taken');
    await expect(el).toHaveAttribute('value', 'Repo');
});

test('a save the page waits on finishes only when it says yes', async ({ page }) => {
    const el = await editor(page);
    await page.evaluate(() => {
        document.querySelector('#e').addEventListener('save', ev => ev.detail.waitUntil(new Promise(resolve => { window.__answer = resolve; })));
    });
    await text(el).click();
    await field(el).fill('Slow');
    await button(el, 'save').click();
    await expect(el).toHaveAttribute('saving', '');
    await page.evaluate(() => window.__answer(false));
    await expect(el).not.toHaveAttribute('saving');
    await expect(el).toHaveAttribute('editing', '');
    await button(el, 'save').click();
    await expect(el).toHaveAttribute('saving', '');
    await page.evaluate(() => window.__answer(true));
    await expect(text(el)).toHaveText('Slow');
    await expect.poll(() => events(page)).toEqual([['save', 'Slow'], ['save', 'Slow'], ['change', 'Slow']]);
});

test('Escape in the field does not reach what the field sits in', async ({ page }) => {
    const el = await editor(page);
    await page.evaluate(() => { window.__outside = 0; document.addEventListener('keydown', ev => { if (ev.key === 'Escape') window.__outside++; }); });
    await text(el).click();
    await field(el).press('Escape');
    await expect(el.locator('.edit-form')).toBeHidden();
    await expect.poll(() => page.evaluate(() => window.__outside)).toBe(0);
});

test('the text is shown as written, never as markup', async ({ page }) => {
    const el = await editor(page, '<webui-edit-in-place id="e"></webui-edit-in-place>');
    await el.evaluate(node => node.setAttribute('value', '<img src=x onerror="window.__xss=1">'));
    await expect(text(el)).toHaveText('<img src=x onerror="window.__xss=1">');
    await expect(el.locator('img')).toHaveCount(0);
});

test('hidden hides it, as on any element', async ({ page }) => {
    const root = await mount(page, '<webui-edit-in-place id="e" value="Repo" hidden></webui-edit-in-place>');
    await expect(root.locator('#e')).toBeHidden();
});
