import { test, expect, mount } from '../support/webui.mjs';

// Replaces fetch for one test and records what the framework sent.
const captureFetch = page => page.evaluate(() => {
    window.__sent = [];
    window.fetch = async (url, init = {}) => {
        window.__sent.push({ url: `${url}`, method: init.method, headers: { ...init.headers }, body: init.body instanceof FormData ? 'FormData' : init.body, credentials: init.credentials });
        return new Response('ok');
    };
});

test('webui.fetchApi prefixes the API root and sends JSON', async ({ page }) => {
    await captureFetch(page);
    const sent = await page.evaluate(async () => { await webui.fetchApi('user/x', { a: 1 }); return window.__sent[0]; });
    expect(sent.url).toBe('https://api.myfi.ws/user/x');
    expect(sent.method).toBe('POST');
    expect(sent.body).toBe('{"a":1}');
    expect(sent.credentials).toBe('include');
    expect(sent.headers['Content-Type']).toBe('application/json');
    expect(`${sent.headers['x-cookie-age']}`).toBe('30');
});
test('webui.fetchApi sends text and drops the body on GET', async ({ page }) => {
    await captureFetch(page);
    const [text, get] = await page.evaluate(async () => {
        await webui.fetchApi('http://x/a', 'hello');
        await webui.fetchApi('http://x/b', { a: 1 }, 'get');
        return window.__sent;
    });
    expect(text.headers['Content-Type']).toBe('text/plain');
    expect(text.body).toBe('hello');
    expect(get.method).toBe('GET');
    expect(get.body).toBeUndefined();
});
test('webui.fetchApi lets the browser set the FormData content type', async ({ page }) => {
    await captureFetch(page);
    const sent = await page.evaluate(async () => { await webui.fetchApi('http://x/y', new FormData()); return window.__sent[0]; });
    expect(sent.headers['Content-Type']).toBeUndefined();
    expect(sent.body).toBe('FormData');
});
test('webui.fetchApi honours a content type passed in headers', async ({ page }) => {
    await captureFetch(page);
    const sent = await page.evaluate(async () => { await webui.fetchApi('http://x/y', { a: 1, headers: { 'Content-Type': 'application/foo' } }); return window.__sent[0]; });
    expect(sent.headers['Content-Type']).toBe('application/foo');
    expect(sent.body).toBe('{"a":1}');
});
test('webui.fetchWithCache shares one request per url and type', async ({ page }) => {
    expect(await page.evaluate(async () => {
        const original = window.fetch;
        let count = 0;
        window.fetch = (...args) => { count++; return original(...args); };
        const [a, b] = await Promise.all([webui.fetchWithCache('/robots.txt'), webui.fetchWithCache('/robots.txt')]);
        const c = await webui.fetchWithCache('/robots.txt');
        const json = await webui.fetchWithCache('/appConfig.json', true);
        const text = await webui.fetchWithCache('/appConfig.json');
        return [count, a === b && b === c, typeof json, typeof text];
    })).toEqual([3, true, 'object', 'string']);
});
test('webui.fetchWithCache rejects errors and allows a retry', async ({ page }) => {
    expect(await page.evaluate(async () => {
        const original = window.fetch;
        let count = 0;
        window.fetch = (...args) => { count++; return original(...args); };
        const attempt = () => webui.fetchWithCache('/missing-file.md').then(() => 'resolved', () => 'rejected');
        return [await attempt(), await attempt(), count];
    })).toEqual(['rejected', 'rejected', 2]);
});
test('webui.getQueryData reads the query string', async ({ page }) => {
    expect(await page.evaluate(() => {
        const empty = webui.getQueryData('a');
        history.replaceState(null, '', '?a=1&b=x=y&c');
        return [empty, webui.getQueryData('a'), webui.getQueryData('b'), webui.getQueryData()];
    })).toEqual([null, '1', 'x=y', { a: '1', b: 'x=y' }]);
});
test('webui.getSearchData is the same as getQueryData', async ({ page }) => {
    expect(await page.evaluate(() => {
        history.replaceState(null, '', '?a=1');
        return webui.getSearchData('a');
    })).toBe('1');
});
test('webui.getResponseHeader returns the first header found', async ({ page }) => {
    expect(await page.evaluate(() => webui.getResponseHeader(new Response('', { headers: { 'x-b': '2' } }), 'x-a', 'x-b'))).toBe('2');
});
test('webui.try reports errors from sync, async, and promise returning handlers', async ({ page }) => {
    expect(await page.evaluate(async () => {
        const seen = [];
        const onError = ex => seen.push(ex.message);
        let finished = 0;
        const value = await webui.try(() => 5);
        await webui.try(() => { throw new Error('sync'); }, onError, () => finished++);
        await webui.try(async () => { throw new Error('async'); }, onError);
        await webui.try(() => Promise.reject(new Error('promise')), onError);
        return [value, seen, finished];
    })).toEqual([5, ['sync', 'async', 'promise'], 1]);
});
test('webui.trySoloProcess skips calls while one is running', async ({ page }) => {
    expect(await page.evaluate(async () => {
        let runs = 0;
        const slow = () => new Promise(r => setTimeout(() => { runs++; r('done'); }, 30));
        const [first, second] = await Promise.all([webui.trySoloProcess(slow), webui.trySoloProcess(slow)]);
        const after = await webui.trySoloProcess(() => 'again');
        return [first, second === undefined, runs, after];
    })).toEqual(['done', true, 1, 'again']);
});
test('webui.eventSoloProcess wraps a handler with the same lock', async ({ page }) => {
    expect(await page.evaluate(async () => {
        let runs = 0;
        const handler = webui.eventSoloProcess(() => new Promise(r => setTimeout(() => { runs++; r(); }, 30)));
        await Promise.all([handler(), handler()]);
        return runs;
    })).toBe(1);
});
test('webui.wait waits for time or a condition', async ({ page }) => {
    expect(await page.evaluate(async () => {
        const start = Date.now();
        await webui.wait(30);
        const elapsed = Date.now() - start;
        let n = 0;
        await webui.wait(() => ++n > 1);
        return [elapsed >= 25, n];
    })).toEqual([true, 2]);
});
test('webui.openSharedDrawer and webui.closeSharedDrawer control the shared drawer', async ({ page }) => {
    const root = await mount(page, '<webui-drawer class="shared"></webui-drawer>');
    const drawer = root.locator('webui-drawer');
    await page.evaluate(() => webui.openSharedDrawer('Title', '<p>Body</p>'));
    await expect(drawer).toHaveClass(/open/);
    await expect(drawer.locator('header')).toHaveText('Title');
    await expect(drawer.locator('section p')).toHaveText('Body');
    await page.evaluate(() => webui.closeSharedDrawer());
    await expect(drawer).not.toHaveClass(/open/);
});
test('webui.openSharedDrawer falls back to a dialog and returns the content', async ({ page }) => {
    await mount(page, '<webui-dialogs></webui-dialogs>');
    expect(await page.evaluate(async () => {
        const content = await webui.openSharedDrawer('Title', '<p>Body</p>');
        return content.innerText;
    })).toBe('Body');
    await expect(page.locator('webui-dialogs dialog')).toBeVisible();
});
