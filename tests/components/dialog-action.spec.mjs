import { test, expect, mount } from '../support/webui.mjs';

const action = (page, attributes = '') => mount(page, `<webui-dialogs></webui-dialogs><webui-alerts></webui-alerts>
<webui-dialog-action data-subscribe="da-open" api="post|http://localhost:3199/da-api" ${attributes}><template><p>Are you sure?</p></template></webui-dialog-action>`);

test('setting its value opens the dialog and clears the trigger', async ({ page }) => {
    const root = await action(page);
    await expect.poll(() => root.locator('webui-dialog-action').evaluate(el => typeof el.setValue)).toBe('function');
    await page.evaluate(() => customElements.whenDefined('webui-dialog-action'));
    await page.evaluate(() => webui.setData('da-open', { id: 7 }));
    const dialog = root.locator('webui-dialogs dialog');
    await expect(dialog).toContainText('Are you sure?');
    expect(await page.evaluate(() => webui.getData('da-open'))).toBeUndefined();
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
    await expect(dialog.locator('webui-alert')).toContainText('Nope');
    await expect(dialog).toBeVisible();
});
test('a network failure stays open and shows the error', async ({ page }) => {
    await page.route('**/da-api', route => route.abort());
    const root = await action(page);
    await page.evaluate(() => webui.setData('da-open', { id: 7 }));
    const dialog = root.locator('webui-dialogs dialog');
    await dialog.locator('#dlg-confirm').click();
    await expect(dialog.locator('webui-alert').last()).toContainText('Failed to fetch');
});
