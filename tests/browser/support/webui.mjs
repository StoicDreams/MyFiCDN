import { test as base, expect } from '@playwright/test';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const CDN_ROOT = fileURLToPath(new URL('../../../cdn', import.meta.url));
const MIME = {
    '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.html': 'text/html',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.md': 'text/plain', '.webui': 'text/plain', '.txt': 'text/plain',
};

// A bare page with the framework loaded. Without webui-app no page content loads, so anything mounted stays put.
const BLANK_PAGE = `<!DOCTYPE html><html lang="en"><head><base href="/"><meta charset="utf-8"><title>Web UI Tests</title>
<link href="css/webui.min.css" rel="stylesheet"><script src="webui/loader.min.js" async></script></head>
<body><webui-app-config src="appConfig.json"></webui-app-config></body></html>`;

// Only the minified files are tested: they are what sites load.
function resolveFile(pathname) {
    const file = normalize(join(CDN_ROOT, decodeURIComponent(pathname)));
    if (!file.startsWith(CDN_ROOT + sep)) return null;
    return existsSync(file) && statSync(file).isFile() ? file : null;
}

function serveFromDisk(route, origin) {
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
    const file = resolveFile(url.pathname);
    if (file) {
        return route.fulfill({ headers, contentType: MIME[extname(file)] || 'application/octet-stream', body: readFileSync(file) });
    }
    if (extname(url.pathname)) {
        return route.fulfill({ headers, status: 404, contentType: 'text/plain', body: 'Not Found' });
    }
    // Page routes fall back to the app shell, the same as the deployed site.
    return route.fulfill({ contentType: 'text/html', body: readFileSync(join(CDN_ROOT, 'index.html')) });
}

// The tests that need a real browser: layout, real media, mouse positions, scrolling, navigation. Everything else is
// in tests/unit, which runs the same minified files in jsdom. Each test has its own page, so nothing carries over.
export const test = base.extend({
    // Change with test.use({ startUrl: '/' }) to test the real site shell instead of the bare page.
    startUrl: ['/__blank', { option: true }],
    page: async ({ page, startUrl, baseURL }, use) => {
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
            // The app config loads user roles on startup. This resolves once the loader has applied that first
            // response, so it cannot overwrite roles a test sets afterwards.
            const realFetch = window.fetch;
            let startupRoles = true;
            window.__startupRolesApplied = new Promise(resolve => {
                // Promise reactions run in the order they were added, and these are added before the loader's own,
                // so a microtask queued from here runs after the loader has handled the same result.
                const applied = () => queueMicrotask(resolve);
                window.fetch = function (input, ...rest) {
                    const result = realFetch.call(window, input, ...rest);
                    if (!startupRoles) return result;
                    const url = typeof input === 'string' ? input : input?.url || `${input}`;
                    if (!/\/user\/roles$/.test(new URL(url, location.href).pathname)) return result;
                    startupRoles = false;
                    result.then(response => {
                        if (response.status !== 200) return applied();
                        const readText = response.text;
                        response.text = function () {
                            const body = readText.call(this);
                            body.then(applied, applied);
                            return body;
                        };
                    }, applied);
                    return result;
                };
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
        await page.route('**/*', route => serveFromDisk(route, baseURL));
        await page.goto(startUrl);
        // The loader adds the tooltip a moment after it starts, and a hover before then shows nothing.
        await page.waitForFunction(() => typeof webui === 'object' && webui.loaded && webui.appConfig?.appName
            && document.querySelector('body > .tooltip'));
        await page.evaluate(() => window.__startupRolesApplied);
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
