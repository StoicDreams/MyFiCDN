import { test, expect, mount } from '../support/webui.mjs';

test('src loads json into the data-trigger key', async ({ page }) => {
    await page.route('**/loader-test.json', route => route.fulfill({ contentType: 'application/json', body: '{"a":1}' }));
    await mount(page, '<webui-data-loader src="/loader-test.json" data-trigger="dl-result" delay="1"></webui-data-loader>');
    await expect.poll(() => page.evaluate(() => webui.getData('dl-result'))).toEqual({ a: 1 });
});
test('non json responses are stored as text', async ({ page }) => {
    await page.route('**/loader-test.txt', route => route.fulfill({ contentType: 'text/plain', body: 'words' }));
    await mount(page, '<webui-data-loader src="/loader-test.txt" data-trigger="dl-text" delay="1"></webui-data-loader>');
    await expect.poll(() => page.evaluate(() => webui.getData('dl-text'))).toBe('words');
});
test('apiroot only fetches the keys it was given', async ({ page }) => {
    const requested = [];
    await page.evaluate(() => webui.setData('dl-root', 'https://cdn.myfi.ws'));
    await page.route('https://cdn.myfi.ws/dl/**', route => {
        requested.push(new URL(route.request().url()).pathname);
        return route.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true}' });
    });
    await mount(page, '<webui-data-loader apiroot="dl-root" src="/dl/main" data-trigger="dl-main" data-other="/dl/other" delay="1"></webui-data-loader>');
    await expect.poll(() => page.evaluate(() => [webui.getData('dl-main'), webui.getData('other')])).toEqual([{ ok: true }, { ok: true }]);
    expect(requested.sort()).toEqual(['/dl/main', '/dl/other']);
});
test('auth waits for its token and sends it', async ({ page }) => {
    let authorization;
    await page.route('**/secure.json', route => {
        authorization = route.request().headers().authorization;
        return route.fulfill({ contentType: 'application/json', body: '1' });
    });
    await mount(page, '<webui-data-loader auth="dl-token" src="/secure.json" data-trigger="dl-secure" delay="1"></webui-data-loader>');
    await page.evaluate(() => webui.setData('dl-token', 'abc'));
    await expect.poll(() => page.evaluate(() => webui.getData('dl-secure'))).toBe(1);
    expect(authorization).toBe('abc');
});
