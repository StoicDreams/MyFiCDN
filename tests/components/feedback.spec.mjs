import { test, expect, mount } from '../support/webui.mjs';

const feedback = async (page, attributes) => {
    const root = await mount(page, `<webui-dialogs></webui-dialogs><webui-feedback ${attributes}></webui-feedback>`);
    return { root, dialog: root.locator('webui-dialogs dialog'), el: root.locator('webui-feedback') };
};

test('without data-post it explains what is missing', async ({ page }) => {
    const { el, dialog } = await feedback(page, '');
    await el.evaluate(c => c.click());
    await expect(dialog).toContainText('data-post');
});
test('an empty message is rejected', async ({ page }) => {
    const { el, dialog } = await feedback(page, 'data-post="http://localhost:3199/fb"');
    await el.evaluate(c => c.click());
    await dialog.locator('#dlg-confirm').click();
    await expect(dialog.locator('#alert')).toContainText('Please provide a message');
    await expect(dialog).toBeVisible();
});
test('a message posts as text, closes, and alerts', async ({ page }) => {
    let sent;
    await page.route('**/fb', route => { sent = [route.request().postData(), route.request().headers()['content-type']]; return route.fulfill({ body: 'Thanks' }); });
    const { el, dialog } = await feedback(page, 'data-post="http://localhost:3199/fb"');
    await page.evaluate(() => { window.__alerts = []; webui.alert = message => window.__alerts.push(message); });
    await el.evaluate(c => c.click());
    await dialog.locator('webui-input-message textarea').fill('Hello');
    await dialog.locator('#dlg-confirm').click();
    await expect(dialog).toBeHidden();
    expect(sent).toEqual(['Hello', 'text/plain']);
    expect(await page.evaluate(() => window.__alerts)).toEqual(['Thanks']);
});
test('data-json-name posts json', async ({ page }) => {
    let sent;
    await page.route('**/fb', route => { sent = [route.request().postData(), route.request().headers()['content-type']]; return route.fulfill({ body: '' }); });
    const { el, dialog } = await feedback(page, 'data-post="http://localhost:3199/fb" data-json-name="msg"');
    await el.evaluate(c => c.click());
    await dialog.locator('webui-input-message textarea').fill('Hi');
    await dialog.locator('#dlg-confirm').click();
    await expect(dialog).toBeHidden();
    expect(sent).toEqual(['{"msg":"Hi"}', 'application/json']);
});
test('data-form-name posts multipart with a boundary', async ({ page }) => {
    let type;
    await page.route('**/fb', route => { type = route.request().headers()['content-type']; return route.fulfill({ body: '' }); });
    const { el, dialog } = await feedback(page, 'data-post="http://localhost:3199/fb" data-form-name="msg"');
    await el.evaluate(c => c.click());
    await dialog.locator('webui-input-message textarea').fill('Hi');
    await dialog.locator('#dlg-confirm').click();
    await expect(dialog).toBeHidden();
    expect(type).toMatch(/^multipart\/form-data; boundary=/);
});
test('a server error stays open and shows it', async ({ page }) => {
    await page.route('**/fb', route => route.fulfill({ status: 500, body: 'Broken' }));
    const { el, dialog } = await feedback(page, 'data-post="http://localhost:3199/fb"');
    await el.evaluate(c => c.click());
    await dialog.locator('webui-input-message textarea').fill('Hello');
    await dialog.locator('#dlg-confirm').click();
    await expect(dialog.locator('#alert')).toContainText('Broken');
});
test('data-click links open it', async ({ page }) => {
    const { root, el, dialog } = await feedback(page, '');
    await expect(el).toHaveAttribute('data-subscribe', 'feedback:click');
    await root.evaluate(r => {
        const link = document.createElement('a');
        link.dataset.click = 'feedback';
        r.appendChild(link);
    });
    await page.waitForTimeout(50);
    await root.locator('a').evaluate(a => a.click());
    await expect(dialog).toBeVisible();
});
