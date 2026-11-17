import { test, expect, mount } from '../support/webui.mjs';

const preview = async (page, attributes = '') => {
    const root = await mount(page, `<webui-email-preview ${attributes}></webui-email-preview>`);
    return root.locator('webui-email-preview');
};
const frameBody = el => el.locator('iframe').contentFrame().locator('body');

test('shows the subject and HTML from data-subscribe, and toggles to the text version', async ({ page }) => {
    const el = await preview(page, 'data-subscribe="ep-draft"');
    await page.evaluate(() => webui.setData('ep-draft', { subject: 'Hello', bodyHtml: '<h1>Big news</h1>', bodyText: 'Big news' }));
    await expect(el.locator('.subject-value')).toHaveText('Hello');
    await expect(frameBody(el).locator('h1')).toHaveText('Big news');
    await expect(el.locator('.text-view')).toBeHidden();
    const toggle = el.locator('button.toggle');
    await expect(toggle).toHaveText('Show Text');
    await toggle.click();
    await expect(el.locator('.text-view')).toHaveText('Big news');
    await expect(el.locator('iframe')).toBeHidden();
    await expect(toggle).toHaveText('Show HTML');
    await toggle.press('Enter');
    await expect(el.locator('iframe')).toBeVisible();
});

test('fields from several keys add together, and snake case names are read', async ({ page }) => {
    const el = await preview(page, 'data-subscribe="ep-saved|ep-edits"');
    await page.evaluate(() => {
        webui.setData('ep-saved', { subject: 'Saved subject', body_html: '<p>Saved body</p>', body_text: 'Saved text' });
        // A field typed since, as a dialog's inputs write with data-trigger.
        webui.setData('ep-edits.subject', 'Edited subject');
    });
    await expect(el.locator('.subject-value')).toHaveText('Edited subject');
    await expect(frameBody(el)).toContainText('Saved body');
});

test('values that are not objects are ignored', async ({ page }) => {
    const el = await preview(page, 'data-subscribe="ep-reset"');
    await page.evaluate(() => webui.setData('ep-reset', '1'));
    await expect(el.locator('.subject-value')).toHaveText('(no subject)');
    await expect(frameBody(el)).toContainText('The email shows here as you write it.');
});

test('HTML is limited the way mail apps limit it, and the preview says what was removed', async ({ page }) => {
    const el = await preview(page, 'data-subscribe="ep-unsafe"');
    await page.evaluate(() => webui.setData('ep-unsafe', {
        bodyHtml: '<p onclick="alert(1)" style="color:red;position:fixed;top:0">Kept</p><script>window.parent.__ran = 1</script>'
            + '<form><input name="x"></form><a href="javascript:alert(1)">bad</a><a href="https://example.com">good</a><iframe src="https://example.com"></iframe>',
    }));
    const body = frameBody(el);
    await expect(body.locator('p')).toHaveText('Kept');
    await expect(body.locator('script, form, input, iframe')).toHaveCount(0);
    await expect(body.locator('p')).not.toHaveAttribute('onclick', /./);
    await expect(body.locator('p')).toHaveAttribute('style', /color:red/);
    await expect(body.locator('p')).not.toHaveAttribute('style', /position/);
    await expect(body.locator('a', { hasText: 'bad' })).not.toHaveAttribute('href', /./);
    await expect(body.locator('a', { hasText: 'good' })).toHaveAttribute('target', '_blank');
    await expect(el.locator('.notices')).toContainText('<script>');
    await expect(el.locator('.notices')).toContainText('<form>');
    await expect(el.locator('.notices')).toContainText('event handlers');
    expect(await page.evaluate(() => window.__ran)).toBeUndefined();
    // The frame runs no script at all, even if something got past the filter.
    await expect(el.locator('iframe')).toHaveAttribute('sandbox', /^(?!.*allow-scripts)/);
});

test('with api, the fields and the data-api object are sent, and the email it returns is shown', async ({ page }) => {
    const requests = [];
    await page.route('**/preview-api', route => {
        const body = JSON.parse(route.request().postData());
        requests.push(body);
        return route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify({
                subject: body.subject,
                html: `<p>Header</p>${body.bodyHtml}<p>Unsubscribe</p>`,
                text: `Header\n${body.bodyText}\nUnsubscribe`,
                notices: ['Add a postal address.'],
            }),
        });
    });
    await page.evaluate(() => webui.setData('ep-filter', { newsletterId: '7' }));
    const el = await preview(page, 'api="post|http://localhost:3199/preview-api" data-api="ep-filter" data-subscribe="ep-api-draft"');
    await page.evaluate(() => webui.setData('ep-api-draft.bodyHtml', '<p>Mine</p>'));
    await expect(frameBody(el)).toContainText('HeaderMineUnsubscribe');
    await expect(el.locator('.notices')).toContainText('Add a postal address.');
    // Fields not given yet are sent empty, so an API that needs every field still answers.
    expect(requests.at(-1)).toEqual({ newsletterId: '7', subject: '', bodyHtml: '<p>Mine</p>', bodyText: '' });
    await el.locator('button.toggle').click();
    await expect(el.locator('.text-view')).toHaveText('Header\n\nUnsubscribe');
});

test('typing in a burst asks the api once', async ({ page }) => {
    let count = 0;
    await page.route('**/preview-api', route => {
        count++;
        return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ subject: 's', html: '<p>x</p>', text: 'x' }) });
    });
    const el = await preview(page, 'api="post|http://localhost:3199/preview-api" data-subscribe="ep-burst"');
    await page.evaluate(async () => {
        for (const text of ['H', 'He', 'Hel', 'Hell', 'Hello']) {
            webui.setData('ep-burst.subject', text);
            await new Promise(r => setTimeout(r, 30));
        }
    });
    await expect(el.locator('.subject-value')).toHaveText('s');
    expect(count).toBe(1);
});

test('an api error is shown, as text', async ({ page }) => {
    await page.route('**/preview-api', route => route.fulfill({ status: 400, contentType: 'text/plain', body: 'Newsletter <b>not</b> found' }));
    const el = await preview(page, 'api="post|http://localhost:3199/preview-api" data-subscribe="ep-error"');
    await page.evaluate(() => webui.setData('ep-error', { subject: 'x' }));
    await expect(el.locator('.status')).toHaveText('Newsletter <b>not</b> found');
});

test('height sets the size of both views', async ({ page }) => {
    const el = await preview(page, 'height="300"');
    // Applied as the setting both views use. How tall they look is checked by eye.
    expect(await el.evaluate(c => c.style.getPropertyValue('--email-preview-height'))).toBe('300px');
});
