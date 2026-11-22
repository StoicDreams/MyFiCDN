import { test, expect, mount } from '../support/webui.mjs';

const action = (page, attributes = '') => mount(page, `<webui-dialogs></webui-dialogs><webui-alerts></webui-alerts>
<webui-dialog-action data-subscribe="da-open" api="post|http://localhost:3199/da-api" ${attributes}><template><p>Are you sure?</p></template></webui-dialog-action>`);

test('setting its value opens the dialog and clears the trigger', async ({ page }) => {
    const root = await action(page);
    await expect.poll(() => root.locator('webui-dialog-action').evaluate(el => typeof el.setValue)).toBe('function');
    await page.evaluate(() => customElements.whenDefined('webui-dialog-action'));
    await page.evaluate(() => webui.setData('da-open', { id: 7 }));
    const dialog = root.locator('webui-dialogs dialog');
    await expect(root.locator('webui-dialogs form')).toContainText('Are you sure?');
    await expect.poll(() => page.evaluate(() => webui.getData('da-open'))).toBeUndefined();
});
test('with data-bind, opening clears the key, so the same value opens it again', async ({ page }) => {
    const root = await mount(page, `<webui-dialogs></webui-dialogs><webui-alerts></webui-alerts>
<webui-dialog-action data-bind="da-bound : setValue" api="post|http://localhost:3199/da-api"><template><p>Are you sure?</p></template></webui-dialog-action>`);
    await page.evaluate(() => customElements.whenDefined('webui-dialog-action'));
    await page.evaluate(() => webui.setData('da-bound', { id: 7 }));
    await expect(root.locator('webui-dialogs form')).toContainText('Are you sure?');
    await expect.poll(() => page.evaluate(() => webui.getData('da-bound'))).toBeUndefined();
});
test('confirm posts the value and closes on success', async ({ page }) => {
    let body;
    await page.route('**/da-api', route => { body = route.request().postData(); return route.fulfill({ body: 'Done' }); });
    const root = await action(page, 'data-success="da-result"');
    await page.evaluate(() => webui.setData('da-open', { id: 7 }));
    const dialog = root.locator('webui-dialogs dialog');
    await expect(dialog).toBeVisible();
    await dialog.locator('#dlg-confirm').click();
    await expect(dialog).toBeHidden();
    expect(JSON.parse(body)).toEqual({ id: 7 });
    await expect.poll(() => page.evaluate(() => webui.getData('da-result'))).toBe('Done');
});
test('a failed request stays open and shows the error', async ({ page }) => {
    await page.route('**/da-api', route => route.fulfill({ status: 400, body: 'Nope' }));
    const root = await action(page);
    await page.evaluate(() => webui.setData('da-open', { id: 7 }));
    const dialog = root.locator('webui-dialogs dialog');
    await dialog.locator('#dlg-confirm').click();
    await expect(root.locator('webui-dialogs form webui-alert')).toContainText('Nope');
    await expect(dialog).toBeVisible();
});
test('a failed request brings its error into view, and says so when the answer is empty', async ({ page }) => {
    await page.route('**/da-api', route => route.fulfill({ status: 400, body: '' }));
    const root = await action(page);
    // Under a long form the alert is below what the dialog shows, so the dialog must scroll to it.
    await page.evaluate(() => {
        window.daScrolled = [];
        Element.prototype.scrollIntoView = function () { window.daScrolled.push(this.tagName.toLowerCase()); };
    });
    await page.evaluate(() => webui.setData('da-open', { id: 7 }));
    const dialog = root.locator('webui-dialogs dialog');
    await dialog.locator('#dlg-confirm').click();
    await expect(root.locator('webui-dialogs form webui-alert')).toContainText('The request failed (400). Nothing was saved.');
    expect(await page.evaluate(() => window.daScrolled)).toContain('webui-alert');
    await expect(dialog).toBeVisible();
});
test('a network failure stays open and shows the error', async ({ page }) => {
    await page.route('**/da-api', route => route.abort());
    const root = await action(page);
    await page.evaluate(() => webui.setData('da-open', { id: 7 }));
    const dialog = root.locator('webui-dialogs dialog');
    await dialog.locator('#dlg-confirm').click();
    await expect(root.locator('webui-dialogs form webui-alert').last()).toContainText('Failed to fetch');
});
