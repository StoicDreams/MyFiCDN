import { test, expect, mount } from '../support/webui.mjs';

const KEY = '00000000-0000-4000-8000-000000000001';

// Answer newsletter/info, and record what newsletter/signup, confirm, and unsubscribe receive.
async function mockApi(page, { info = { status: 200, body: { name: 'Weekly <b>Notes</b>', description: 'One email a week.\nNo spam.' } }, post = { status: 200, body: 'Thank you! Please check your email.' } } = {}) {
    const calls = [];
    await page.route('https://api.myfi.ws/newsletter/**', route => {
        const request = route.request();
        const url = new URL(request.url());
        calls.push({ method: request.method(), path: url.pathname, query: url.search, body: request.postData() });
        const headers = { 'access-control-allow-origin': request.headers().origin || '*', 'access-control-allow-credentials': 'true' };
        if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { ...headers, 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
        const answer = url.pathname === '/newsletter/info' ? info : post;
        const body = typeof answer.body === 'string' ? answer.body : JSON.stringify(answer.body);
        return route.fulfill({ status: answer.status, headers, contentType: typeof answer.body === 'string' ? 'text/plain' : 'application/json', body });
    });
    return calls.filter.bind(calls, call => call.method !== 'OPTIONS');
}

test('shows the offer from newsletter/info as text', async ({ page }) => {
    const calls = await mockApi(page);
    const root = await mount(page, `<webui-newsletter key="${KEY}"></webui-newsletter>`);
    const el = root.locator('webui-newsletter');
    await expect(el).toHaveAttribute('state', 'ready');
    await expect(el.locator('#title')).toHaveText('Weekly <b>Notes</b>');
    await expect(el.locator('#title b')).toHaveCount(0);
    await expect(el.locator('#desc')).toHaveText('One email a week.\nNo spam.');
    expect(calls()[0]).toMatchObject({ method: 'GET', path: '/newsletter/info', query: `?key=${KEY}` });
});

test('slotted content replaces the offer text', async ({ page }) => {
    await mockApi(page);
    const root = await mount(page, `<webui-newsletter key="${KEY}"><h2 slot="title">Join us</h2><p>Our own words.</p></webui-newsletter>`);
    const el = root.locator('webui-newsletter');
    await expect(el).toHaveAttribute('state', 'ready');
    await expect(el.locator('h2')).toBeVisible();
    await expect(el.locator('#title')).toBeHidden();
});

test('an unavailable newsletter explains why on localhost', async ({ page }) => {
    await mockApi(page, { info: { status: 404, body: '' } });
    const root = await mount(page, `<webui-newsletter key="${KEY}"></webui-newsletter>`);
    const el = root.locator('webui-newsletter');
    await expect(el).toHaveAttribute('state', 'unavailable');
    await expect(el.locator('#status')).toContainText('not available on this domain');
});

test('without a key it says so', async ({ page }) => {
    const root = await mount(page, '<webui-newsletter></webui-newsletter>');
    await expect(root.locator('webui-newsletter #status')).toContainText('key attribute');
});

test('signing up posts the key and email, then thanks the visitor', async ({ page }) => {
    const calls = await mockApi(page);
    const root = await mount(page, `<webui-newsletter key="${KEY}" success="Check your inbox."></webui-newsletter>`);
    const el = root.locator('webui-newsletter');
    await expect(el).toHaveAttribute('state', 'ready');
    await el.evaluate(c => { window.__subscribed = 0; c.addEventListener('subscribed', () => window.__subscribed++); });
    await el.getByLabel('Email').fill(' person@example.com ');
    await el.getByRole('button', { name: 'Subscribe' }).click();
    await expect(el.locator('#status')).toHaveText('Check your inbox.');
    await expect(el.locator('form')).toBeHidden();
    await expect(el).toHaveAttribute('state', 'done');
    const signup = calls().find(call => call.path === '/newsletter/signup');
    expect(signup.method).toBe('POST');
    expect(JSON.parse(signup.body)).toEqual({ key: KEY, email: 'person@example.com' });
    expect(await page.evaluate(() => window.__subscribed)).toBe(1);
});

test('Enter in the email field submits', async ({ page }) => {
    const calls = await mockApi(page);
    const root = await mount(page, `<webui-newsletter key="${KEY}"></webui-newsletter>`);
    const el = root.locator('webui-newsletter');
    await expect(el).toHaveAttribute('state', 'ready');
    await el.getByLabel('Email').fill('person@example.com');
    await el.getByLabel('Email').press('Enter');
    await expect(el).toHaveAttribute('state', 'done');
    expect(calls().some(call => call.path === '/newsletter/signup')).toBe(true);
});

test('an invalid email is not sent', async ({ page }) => {
    const calls = await mockApi(page);
    const root = await mount(page, `<webui-newsletter key="${KEY}"></webui-newsletter>`);
    const el = root.locator('webui-newsletter');
    await expect(el).toHaveAttribute('state', 'ready');
    await el.getByLabel('Email').fill('not an email');
    await el.getByRole('button', { name: 'Subscribe' }).click();
    await expect(el.locator('#status')).toHaveText('Please enter a valid email address.');
    expect(calls().some(call => call.path === '/newsletter/signup')).toBe(false);
});

test('a filled trap field pretends to succeed without sending', async ({ page }) => {
    const calls = await mockApi(page);
    const root = await mount(page, `<webui-newsletter key="${KEY}"></webui-newsletter>`);
    const el = root.locator('webui-newsletter');
    await expect(el).toHaveAttribute('state', 'ready');
    await el.locator('#website').evaluate(input => { input.value = 'spam'; });
    await el.getByLabel('Email').fill('bot@example.com');
    await el.getByRole('button', { name: 'Subscribe' }).click();
    await expect(el).toHaveAttribute('state', 'done');
    expect(calls().some(call => call.path === '/newsletter/signup')).toBe(false);
});

test('an API error is shown as text and the form stays', async ({ page }) => {
    await mockApi(page, { post: { status: 429, body: 'Too many <i>signups</i>.' } });
    const root = await mount(page, `<webui-newsletter key="${KEY}"></webui-newsletter>`);
    const el = root.locator('webui-newsletter');
    await expect(el).toHaveAttribute('state', 'ready');
    await el.getByLabel('Email').fill('person@example.com');
    await el.getByRole('button', { name: 'Subscribe' }).click();
    await expect(el.locator('#status')).toHaveText('Too many <i>signups</i>.');
    await expect(el.locator('form')).toBeVisible();
    await expect(el.getByRole('button', { name: 'Subscribe' })).toBeEnabled();
});

test('confirm waits for a click, then posts the token', async ({ page }) => {
    const calls = await mockApi(page, { post: { status: 200, body: { message: 'You are subscribed to Weekly Notes from www.example.com.' } } });
    const root = await mount(page, '<webui-newsletter confirm token="abc-123"></webui-newsletter>');
    const el = root.locator('webui-newsletter');
    const button = el.getByRole('button', { name: 'Confirm my subscription' });
    await expect(button).toBeVisible();
    expect(calls()).toEqual([]);
    await button.click();
    await expect(el.locator('#status')).toHaveText('You are subscribed to Weekly Notes from www.example.com.');
    await expect(button).toBeHidden();
    const confirm = calls()[0];
    expect(confirm.path).toBe('/newsletter/confirm');
    expect(JSON.parse(confirm.body)).toEqual({ token: 'abc-123' });
});

test('confirm reads the token from the address', async ({ page }) => {
    const calls = await mockApi(page, { post: { status: 200, body: { message: 'Done' } } });
    await page.evaluate(() => history.replaceState(null, '', '/__blank?token=from-url'));
    const root = await mount(page, '<webui-newsletter confirm></webui-newsletter>');
    await root.getByRole('button', { name: 'Confirm my subscription' }).click();
    await expect(root.locator('#status')).toHaveText('Done');
    expect(JSON.parse(calls()[0].body)).toEqual({ token: 'from-url' });
});

test('confirm without a token explains and offers no button', async ({ page }) => {
    const root = await mount(page, '<webui-newsletter confirm></webui-newsletter>');
    const el = root.locator('webui-newsletter');
    await expect(el.locator('#status')).toContainText('missing its token');
    await expect(el.locator('#action')).toBeHidden();
});

test('unsubscribe posts to newsletter/unsubscribe and shows errors', async ({ page }) => {
    const calls = await mockApi(page, { post: { status: 404, body: 'This link is not valid.' } });
    const root = await mount(page, '<webui-newsletter unsubscribe token="abc"></webui-newsletter>');
    const el = root.locator('webui-newsletter');
    await el.getByRole('button', { name: 'Unsubscribe' }).click();
    await expect(el.locator('#status')).toHaveText('This link is not valid.');
    await expect(el).toHaveAttribute('state', 'error');
    expect(calls()[0].path).toBe('/newsletter/unsubscribe');
});
