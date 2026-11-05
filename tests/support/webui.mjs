import { test as base, expect } from '@playwright/test';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const CDN_ROOT = fileURLToPath(new URL('../../cdn', import.meta.url));
const MIME = {
    '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.html': 'text/html',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.md': 'text/plain', '.webui': 'text/plain', '.txt': 'text/plain',
};

// A bare page with the framework loaded. Without webui-app no page content loads, so anything mounted stays put.
const BLANK_PAGE = `<!DOCTYPE html><html lang="en"><head><base href="/"><meta charset="utf-8"><title>Web UI Tests</title>
<link href="css/webui.min.css" rel="stylesheet"><script src="webui/loader.min.js" async></script></head>
<body><webui-app-config src="appConfig.json"></webui-app-config></body></html>`;

function resolveFile(pathname, useMinified) {
    const file = normalize(join(CDN_ROOT, decodeURIComponent(pathname)));
    if (!file.startsWith(CDN_ROOT + sep)) return null;
    if (!useMinified && file.endsWith('.min.js')) {
        const source = file.replace(/\.min\.js$/, '.js');
        if (existsSync(source)) return source;
    }
    return existsSync(file) && statSync(file).isFile() ? file : null;
}

function serveFromDisk(route, useMinified, origin) {
    const request = route.request();
    const url = new URL(request.url());
    const headers = {
        'access-control-allow-origin': request.headers().origin || origin,
        'access-control-allow-credentials': 'true',
    };
    if (url.pathname === '/__blank') {
        return route.fulfill({ contentType: 'text/html', body: BLANK_PAGE });
    }
    // Tests replace this default with page.route when they need a specific API response.
    if (url.hostname === 'api.myfi.ws') {
        return route.fulfill({ headers, contentType: 'text/plain', body: '0' });
    }
    if (url.hostname !== 'localhost' && url.hostname !== 'cdn.myfi.ws') {
        return route.abort();
    }
    const file = resolveFile(url.pathname, useMinified);
    if (file) {
        return route.fulfill({ headers, contentType: MIME[extname(file)] || 'application/octet-stream', body: readFileSync(file) });
    }
    if (extname(url.pathname)) {
        return route.fulfill({ headers, status: 404, contentType: 'text/plain', body: 'Not Found' });
    }
    // Page routes fall back to the app shell, the same as the deployed site.
    return route.fulfill({ contentType: 'text/html', body: readFileSync(join(CDN_ROOT, 'index.html')) });
}

export const test = base.extend({
    useMinified: [false, { option: true }],
    // Change with test.use({ startUrl: '/' }) to test the real site shell instead of the bare page.
    startUrl: ['/__blank', { option: true }],
    page: async ({ page, useMinified, startUrl, baseURL }, use) => {
        const errors = [];
        page.on('pageerror', error => {
            // Failed requests are expected here, since anything outside this site is blocked during tests.
            if (error.message !== 'Failed to fetch') errors.push(error.stack || error.message);
        });
        page.on('console', message => {
            if (message.type() === 'error' && message.text().startsWith('Error setting data')) {
                errors.push(message.text());
            }
        });
        await page.exposeFunction('__reportTestError', message => errors.push(message));
        // The loader handles window errors itself, so they never reach pageerror unless reported from here.
        await page.addInitScript(() => {
            window.addEventListener('error', event => {
                window.__reportTestError(event.error?.stack || event.message);
            });
            window.addEventListener('unhandledrejection', event => {
                const reason = event.reason;
                // Failed requests are expected here, since anything outside this site is blocked during tests.
                if (reason instanceof TypeError && reason.message === 'Failed to fetch') return;
                if (reason instanceof TypeError || reason instanceof ReferenceError || reason instanceof SyntaxError) {
                    window.__reportTestError(reason.stack || `${reason}`);
                }
            });
        });
        await page.route('**/*', route => serveFromDisk(route, useMinified, baseURL));
        // The app config loads user roles on startup, and that response must not overwrite roles a test sets.
        const rolesLoaded = page.waitForResponse('https://api.myfi.ws/user/roles');
        await page.goto(startUrl);
        await page.waitForFunction(() => typeof webui === 'object' && webui.loaded && webui.appConfig?.appName);
        await rolesLoaded;
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve)));
        await use(page);
        expect(errors, 'Uncaught errors happened while this test ran').toEqual([]);
    },
});

export { expect };

/**
 * Put HTML on the page and wait for the components in it to load.
 * Returns a locator for the container. Locators see inside shadow DOM automatically.
 */
export async function mount(page, html) {
    const tags = [...new Set((html.match(/<(webui|app)-[a-z0-9-]+/g) || []).map(tag => tag.substring(1)))];
    await page.evaluate(async ({ html, tags }) => {
        let root = document.getElementById('test-root');
        if (!root) {
            root = document.createElement('div');
            root.id = 'test-root';
            document.body.appendChild(root);
        }
        root.innerHTML = html;
        await Promise.all(tags.map(tag => customElements.whenDefined(tag)));
    }, { html, tags });
    return page.locator('#test-root');
}
