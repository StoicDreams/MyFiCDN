import { test, expect, mount } from '../support/webui.mjs';

// webui-newsletter's look while it checks its key, which needs the real stylesheets. The rest is in tests/unit.
const KEY = '00000000-0000-4000-8000-000000000001';

/** Holds newsletter/info until the test answers it, and resolves `asked` once the component has asked. */
async function holdInfo(page) {
    let answer;
    let asked;
    const askedPromise = new Promise(resolve => { asked = resolve; });
    await page.route('https://api.myfi.ws/newsletter/**', async route => {
        const request = route.request();
        const headers = { 'access-control-allow-origin': request.headers().origin || '*', 'access-control-allow-credentials': 'true' };
        if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { ...headers, 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
        asked();
        const { status, body } = await new Promise(resolve => { answer = resolve; });
        return route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(body) });
    });
    return { asked: askedPromise, answer: reply => answer(reply) };
}

test('stays hidden while it checks its key, then shows the offer', async ({ page }) => {
    const info = await holdInfo(page);
    const root = await mount(page, `<webui-newsletter key="${KEY}"><p>Our own words.</p></webui-newsletter>`);
    const el = root.locator('webui-newsletter');
    await info.asked;
    await expect(el).toHaveAttribute('state', 'loading');
    await expect(el).toBeHidden();
    await expect(el.getByText('Our own words.')).toBeHidden();
    info.answer({ status: 200, body: { name: 'Weekly Notes', description: '' } });
    await expect(el).toHaveAttribute('state', 'ready');
    await expect(el.getByText('Our own words.')).toBeVisible();
    await expect(el.getByRole('button', { name: 'Subscribe' })).toBeVisible();
});

test('a key that is not good is never shown to visitors while it is checked, and on localhost shows why', async ({ page }) => {
    const info = await holdInfo(page);
    const root = await mount(page, `<webui-newsletter key="${KEY}"></webui-newsletter>`);
    const el = root.locator('webui-newsletter');
    await info.asked;
    await expect(el).toBeHidden();
    info.answer({ status: 404, body: { message: 'Not found' } });
    await expect(el).toHaveAttribute('state', 'unavailable');
    // Only a developer running the site locally sees it, with the reason.
    await expect(el.getByRole('status')).toContainText('Newsletter signup unavailable');
});

test('takes no room on the page before its script has loaded', async ({ page }) => {
    let release;
    await page.route('**/webui/newsletter.min.js', async route => {
        await new Promise(resolve => { release = resolve; });
        await route.fallback();
    });
    await page.evaluate(() => {
        const root = document.createElement('div');
        root.id = 'test-root';
        root.innerHTML = '<webui-newsletter key="x"><p>Our own words.</p></webui-newsletter>';
        document.body.appendChild(root);
    });
    await expect.poll(() => typeof release).toBe('function');
    await expect(page.locator('webui-newsletter')).not.toBeEmpty();
    await expect(page.getByText('Our own words.')).toBeHidden();
    await expect.poll(() => page.evaluate(() => !!customElements.get('webui-newsletter'))).toBe(false);
    release();
    await expect.poll(() => page.evaluate(() => !!customElements.get('webui-newsletter'))).toBe(true);
});
