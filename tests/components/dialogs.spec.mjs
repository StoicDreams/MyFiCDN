import { test, expect, mount } from '../support/webui.mjs';

const ready = async page => {
    const root = await mount(page, '<webui-dialogs></webui-dialogs>');
    return root.locator('webui-dialogs');
};
// Starts a dialog and records how its promise ends, since opening it has to leave the test free to click.
const open = (page, options) => page.evaluate(options => {
    window.__result = 'open';
    webui.dialog(options).then(() => { window.__result = 'confirmed'; }, reason => { window.__result = reason; });
}, options);
const result = page => page.evaluate(() => window.__result);

test('webui.dialog shows title and content, and confirm resolves', async ({ page }) => {
    const el = await ready(page);
    await open(page, { title: 'Title', content: '<p>Body</p>', confirm: 'Yes', cancel: 'No' });
    await expect(el.locator('dialog')).toBeVisible();
    await expect(el.locator('dialog > header > section')).toHaveText('Title');
    await expect(el.locator('form p')).toHaveText('Body');
    await el.locator('#dlg-confirm').click();
    await expect(el.locator('dialog')).toBeHidden();
    await expect.poll(() => result(page)).toBe('confirmed');
});
test('a dialog opened before webui-dialogs is ready shows once it is, and one closed before then never shows', async ({ page }) => {
    // The component's script is loaded with no webui-dialogs element on the page, as when a page calls
    // webui.dialog while it is starting.
    await page.addScriptTag({ url: '/webui/dialogs.min.js' });
    await page.evaluate(() => customElements.whenDefined('webui-dialogs'));
    await page.evaluate(() => { webui.dialog({ content: '<p>Closed early</p>' }).close(); });
    await open(page, { content: '<p>Waited</p>' });
    await expect.poll(() => result(page)).toBe('open');
    const el = await ready(page);
    await expect(el.locator('form p')).toHaveText('Waited');
    await el.locator('#dlg-confirm').click();
    await expect(el.locator('dialog')).toBeHidden();
    await expect.poll(() => result(page)).toBe('confirmed');
});
test('cancel, close, and Escape reject with canceled', async ({ page }) => {
    const el = await ready(page);
    await open(page, { content: 'x', cancel: 'No' });
    await el.locator('#dlg-cancel').click();
    await expect.poll(() => result(page)).toBe('canceled');
    await open(page, { content: 'x' });
    await el.locator('#dlg-close').click();
    await expect.poll(() => result(page)).toBe('canceled');
    await open(page, { content: 'x' });
    await page.keyboard.press('Escape');
    await expect(el.locator('dialog')).toBeHidden();
    await expect.poll(() => result(page)).toBe('canceled');
});
test('clicking the backdrop closes it, but clicking inside does not', async ({ page }) => {
    const el = await ready(page);
    await open(page, { content: '<p>Inside</p>' });
    await el.locator('form p').click();
    await expect(el.locator('dialog')).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(el.locator('dialog')).toBeHidden();
    await expect.poll(() => result(page)).toBe('canceled');
});
test('keyboard activated buttons are not treated as backdrop clicks', async ({ page }) => {
    const el = await ready(page);
    await page.evaluate(() => {
        window.__calls = 0;
        webui.dialog({ content: 'x', onconfirm: () => { window.__calls++; return false; } }).catch(() => {});
    });
    await el.locator('#dlg-confirm').evaluate(button => button.click());
    await expect(el.locator('dialog')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__calls)).toBe(1);
});
test('onconfirm returning false keeps it open, and it receives the form data', async ({ page }) => {
    const el = await ready(page);
    await page.evaluate(() => {
        window.__values = [];
        webui.dialog({
            content: '<input name="field" value="v">',
            onconfirm: async data => { window.__values.push(data.get('field')); return window.__values.length > 1; },
        }).catch(() => {});
    });
    await el.locator('#dlg-confirm').click();
    await expect(el.locator('dialog')).toBeVisible();
    await el.locator('#dlg-confirm').click();
    await expect(el.locator('dialog')).toBeHidden();
    await expect.poll(() => page.evaluate(() => window.__values)).toEqual(['v', 'v']);
});
test('reopening does not stack up close handlers', async ({ page }) => {
    const el = await ready(page);
    await page.evaluate(async () => {
        window.__closes = 0;
        for (let i = 0; i < 2; i++) {
            const p = webui.dialog({ content: 'x', onclose: () => window.__closes++ });
            p.catch(() => {});
            p.close();
        }
    });
    await page.evaluate(() => { webui.dialog({ content: 'x', onclose: () => window.__closes++ }).catch(() => {}); });
    await el.locator('#dlg-close').click();
    await expect.poll(() => page.evaluate(() => window.__closes)).toBe(3);
});
test('webui.dialog.confirm closes unless the callback returns false', async ({ page }) => {
    const el = await ready(page);
    await page.evaluate(() => {
        window.__result = [];
        webui.dialog.confirm('Sure?', () => { window.__result.push('yes'); }).catch(() => {});
    });
    await el.locator('#dlg-confirm').click();
    await expect(el.locator('dialog')).toBeHidden();
    await expect.poll(() => result(page)).toEqual(['yes']);
    await page.evaluate(() => { webui.dialog.confirm('Sure?', () => false).catch(() => {}); });
    await el.locator('#dlg-confirm').click();
    await expect(el.locator('dialog')).toBeVisible();
    await page.evaluate(() => { window.__canceled = 0; });
    await el.locator('#dlg-cancel').click();
    await page.evaluate(() => { webui.dialog.confirm('Sure?', null, () => { window.__canceled++; }).catch(() => {}); });
    await el.locator('#dlg-cancel').click();
    await expect.poll(() => page.evaluate(() => window.__canceled)).toBe(1);
});
test('webui.dialog.prompt escapes the default and returns the input', async ({ page }) => {
    const el = await ready(page);
    await page.evaluate(() => {
        webui.dialog.prompt('Name?', 'a"b<c', value => { window.__value = value; }).catch(() => {});
    });
    const input = el.locator('input[name="prompt_value"]');
    await expect(input).toHaveValue('a"b<c');
    await input.fill('typed');
    await el.locator('#dlg-confirm').click();
    await expect(el.locator('dialog')).toBeHidden();
    await expect.poll(() => page.evaluate(() => window.__value)).toBe('typed');
});
test('webui.dialog.wait shows until the task ends and cannot be dismissed', async ({ page }) => {
    const el = await ready(page);
    await page.evaluate(() => {
        window.__finish = null;
        window.__waited = webui.dialog.wait(new Promise(r => { window.__finish = r; }), 'Working');
    });
    await expect(el.locator('dialog')).toHaveClass(/isloading/);
    await expect(el.locator('form')).toHaveText('Working');
    await page.keyboard.press('Escape');
    await expect(el.locator('dialog')).toBeVisible();
    await page.evaluate(() => window.__finish('done'));
    await expect.poll(() => page.evaluate(() => window.__waited)).toBe('done');
    await expect(el.locator('dialog')).toBeHidden();
});
test('dialog alerts show inside the content and clear on submit', async ({ page }) => {
    const el = await ready(page);
    await page.evaluate(() => {
        webui.dialog({ content: 'x', onconfirm: () => false }).catch(() => {});
        webui.dialog.alert('Problem');
    });
    const alert = el.locator('form webui-alert');
    await expect(alert).toHaveText('Problem');
    await expect(alert).toHaveAttribute('show', 'true');
    await el.locator('#dlg-confirm').click();
    await expect(alert).not.toHaveAttribute('show');
    await expect(alert).toHaveText('');
});

// The element with focus, looking through shadow roots.
const focused = page => page.evaluate(() => {
    let active = document.activeElement;
    while (active && active.shadowRoot && active.shadowRoot.activeElement) active = active.shadowRoot.activeElement;
    return active ? `${active.tagName.toLowerCase()}${active.name ? `[name=${active.name}]` : ''}` : null;
});
test.describe('focus on open', () => {
    test('the first input in the content gets focus', async ({ page }) => {
        await ready(page);
        await open(page, { content: '<p>Text</p><input name="first" /><input name="second" />' });
        await expect.poll(() => focused(page)).toBe('input[name=first]');
    });
    test('inputs inside components are found once they load', async ({ page }) => {
        await ready(page);
        await open(page, { content: '<webui-input-text label="Name"></webui-input-text>' });
        await expect.poll(() => focused(page)).toMatch(/^input/);
    });
    test('textareas and dropdowns count as inputs', async ({ page }) => {
        await ready(page);
        await open(page, { content: '<textarea name="notes"></textarea>' });
        await expect.poll(() => focused(page)).toBe('textarea[name=notes]');
        await page.keyboard.press('Escape');
        await open(page, { content: '<select name="pick"><option>a</option></select>' });
        await expect.poll(() => focused(page)).toBe('select[name=pick]');
    });
    test('disabled, read only, hidden, and button inputs are skipped', async ({ page }) => {
        await ready(page);
        await open(page, { content: '<input name="off" disabled /><input name="ro" readonly /><input type="hidden" name="h" /><input type="button" name="b" value="b" /><input name="gone" style="display:none" /><input name="target" />' });
        await expect.poll(() => focused(page)).toBe('input[name=target]');
    });
    test('an input marked autofocus is preferred', async ({ page }) => {
        await ready(page);
        await open(page, { content: '<input name="first" /><input name="wanted" autofocus />' });
        await expect.poll(() => focused(page)).toBe('input[name=wanted]');
    });
    test('a dialog with no inputs leaves focus alone', async ({ page }) => {
        await page.clock.install();
        const el = await ready(page);
        await open(page, { content: '<p>Just text</p>', cancel: 'No' });
        await expect(el.locator('dialog')).toBeVisible();
        // The dialog looks for an input for three seconds, so move the clock past all of its attempts.
        await page.clock.runFor(4000);
        await expect.poll(() => focused(page)).not.toMatch(/^(input|textarea|select)/);
        await expect(el.locator('dialog')).toBeVisible();
    });
    test('an input that appears later is not focused after the user moves focus', async ({ page }) => {
        await page.clock.install();
        const el = await ready(page);
        await open(page, { content: '<div id="later"></div>', cancel: 'No' });
        await el.locator('#dlg-cancel').focus();
        await el.locator('form #later').evaluate(div => { div.innerHTML = '<input name="late" />'; });
        // The dialog looks for an input for three seconds, so move the clock past all of its attempts.
        await page.clock.runFor(4000);
        await expect.poll(() => focused(page)).toBe('button');
    });
});
test('the close button has a name', async ({ page }) => {
    await ready(page);
    await open(page, { title: 'T', content: 'C' });
    await expect(page.locator('dialog[open]').getByRole('button', { name: 'Close' })).toHaveCount(1);
    // Screen readers announce the title when the dialog opens.
    await expect(page.getByRole('dialog', { name: 'T' })).toHaveCount(1);
});

test('dialog content is in the page itself, so page styles reach it, and its fields submit', async ({ page }) => {
    const el = await ready(page);
    await page.evaluate(() => {
        window.__submitted = null;
        webui.dialog({ content: '<p class="page-styled">Styled</p><input name="answer" value="42" />', confirm: 'Ok', onconfirm: data => { window.__submitted = data.get('answer'); } });
    });
    const content = el.locator('form p.page-styled');
    // In the page, not a shadow root, which is what lets page styles reach it. How it then looks is checked by eye.
    await expect.poll(() => content.evaluate(p => p.getRootNode() === document)).toBe(true);
    await el.locator('#dlg-confirm').click();
    await expect.poll(() => page.evaluate(() => window.__submitted)).toBe('42');
    await expect(el.locator('form')).toHaveCount(1);
});
