// The component test harness: Web UI's minified loader and components running in jsdom, a simulated browser with no
// layout. Each test gets a fresh window through the `page` fixture, so nothing a test does can reach another test.
//
// Tests read as they did in Playwright: `test('...', async ({ page }) => { const root = await mount(page, html); ... })`
// with locators, actions and retrying matchers from ./page.mjs.
//
// What jsdom lacks, and how the harness stands in for it:
// - Requests are answered from cdn/ on disk, for both the test origin and https://cdn.myfi.ws; api.myfi.ws answers 0.
//   page.route() can answer any request first, as in Playwright.
// - window.fetch, crypto.subtle, structuredClone and matchMedia come from Node or simple stand-ins, and the other
//   browser APIs jsdom lacks (observers, dialogs, popovers, clipboard, animations) from ./stand-ins.mjs.
// - ElementInternals has no setFormValue or setValidity, and no form, so they are added.
// - The loader imports the markdown parser with import(), which a jsdom script cannot do, so the harness sets
//   webui.markdown from cdn/js/mdparse.min.js itself.
// - There is no layout: nothing has a size, and stylesheets in shadow roots do not reach getComputedStyle. Tests check
//   the state that decides what shows (attributes, hidden, text), as the behavior-not-looks rule asks anyway.
import jsdom from 'jsdom';
import { existsSync, readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { afterAll, test as base, vi } from 'vitest';
import { MarkdownParser } from '../../../cdn/js/mdparse.min.js';
import { Locator, Page, pageExpect as expect } from './page.mjs';
import { installStandIns, mediaMatcher, pageResponse } from './stand-ins.mjs';
import { allTestNames, cacheFor, fromRoot, testName } from './test-cache.mjs';

export { expect };

const { JSDOM, VirtualConsole, requestInterceptor } = jsdom;
export const CDN_ROOT = new URL('../../../cdn/', import.meta.url).pathname;
export const ORIGIN = 'http://localhost:3199';
const TYPES = {
    '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.html': 'text/html',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.md': 'text/plain', '.webui': 'text/plain', '.txt': 'text/plain',
};
// Messages that are expected in jsdom and say nothing about the code under test.
const EXPECTED_CONSOLE = [/Failed to load markdown parser/, /Not implemented: /];

/** The file on disk for a request to the test origin or the CDN, or null. Always the minified files browsers load. */
export function fileFor(url) {
    const parsed = new URL(url);
    if (!['localhost', 'cdn.myfi.ws'].includes(parsed.hostname)) return null;
    const path = CDN_ROOT + decodeURIComponent(parsed.pathname).replace(/^\/+/, '');
    if (!path.startsWith(CDN_ROOT) || !existsSync(path)) return null;
    return path;
}

/** Answers a request from the files on disk, noting each file it reads in `env.record`, for the test cache. */
function diskResponse(url, env) {
    const parsed = new URL(url);
    if (parsed.hostname === 'api.myfi.ws') return new Response('0', { headers: { 'content-type': 'text/plain', 'access-control-allow-origin': ORIGIN } });
    const file = fileFor(url);
    if (!file) {
        // A page route, with no file extension, gets the site's shell, as the CDN's server does.
        if (['localhost', 'cdn.myfi.ws'].includes(parsed.hostname) && !extname(parsed.pathname)) {
            env.record?.(CDN_ROOT + 'index.html');
            return new Response(readFileSync(CDN_ROOT + 'index.html'), { headers: { 'content-type': 'text/html' } });
        }
        return new Response('Not Found', { status: 404, headers: { 'content-type': 'text/plain' } });
    }
    env.record?.(file);
    return new Response(readFileSync(file), { headers: { 'content-type': TYPES[extname(file)] || 'application/octet-stream' } });
}

/** The page every test starts on: the stylesheet, the loader, the app config, and a root to mount into. */
export const BLANK_PAGE = `<!DOCTYPE html><html lang="en"><head><base href="/"><meta charset="utf-8"><title>Web UI Tests</title>
<link href="css/webui.min.css" rel="stylesheet"><script src="webui/loader.min.js"></script></head>
<body><webui-app-config src="appConfig.json"></webui-app-config><div id="test-root"></div></body></html>`;

function globMatches(pattern, url) {
    if (typeof pattern === 'function') return pattern(new URL(url));
    if (pattern instanceof RegExp) return pattern.test(url);
    const regex = new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*')}$`);
    return regex.test(url);
}

/** A request as page.route handlers and page.on('request') listeners see it. */
class RouteRequest {
    constructor(url, method = 'GET', body = null, headers = {}) {
        this._url = url;
        this._method = method.toUpperCase();
        this._body = body;
        this._headers = headers;
    }
    url() { return this._url; }
    method() { return this._method; }
    headers() { return { ...this._headers }; }
    allHeaders() { return Promise.resolve(this.headers()); }
    headerValue(name) { return Promise.resolve(this._headers[name.toLowerCase()] ?? null); }
    postData() { return this._body; }
    postDataJSON() { return this._body == null ? null : JSON.parse(this._body); }
}

/** The headers of a fetch, as a plain object with lower-case names. */
function headerObject(headers) {
    const result = {};
    if (!headers) return result;
    const entries = typeof headers.forEach === 'function' && !Array.isArray(headers)
        ? (() => { const list = []; headers.forEach((value, key) => list.push([key, value])); return list; })()
        : Array.isArray(headers) ? headers : Object.entries(headers);
    for (const [key, value] of entries) result[key.toLowerCase()] = `${value}`;
    return result;
}

/** A fetch body as the text a server would receive, adding the content type a browser would for it. */
async function serializeBody(window, body, headers) {
    if (body == null) return null;
    if (typeof body === 'string') return body;
    if (body instanceof window.URLSearchParams) {
        headers['content-type'] ??= 'application/x-www-form-urlencoded;charset=UTF-8';
        return body.toString();
    }
    if (body instanceof window.FormData) {
        const form = new FormData();
        for (const [key, value] of body) {
            if (typeof value === 'string') form.append(key, value);
            else form.append(key, new Blob([await value.arrayBuffer()], { type: value.type }), value.name);
        }
        const request = new Request('http://localhost/', { method: 'POST', body: form });
        headers['content-type'] = request.headers.get('content-type');
        return await request.text();
    }
    if (body instanceof window.Blob) {
        if (body.type) headers['content-type'] ??= body.type;
        return Buffer.from(await body.arrayBuffer()).toString('latin1');
    }
    if (body instanceof window.ArrayBuffer || ArrayBuffer.isView(body)) return Buffer.from(body.buffer ?? body).toString('latin1');
    return `${body}`;
}

/** Answers a request through the test's routes, newest first, as Playwright does, then from disk. */
async function answer(env, request) {
    env.emit('request', request);
    for (const route of [...env.routes].reverse()) {
        if (!globMatches(route.pattern, request.url())) continue;
        let result = null;
        await route.handler({
            request: () => request,
            fulfill: async ({ status = 200, contentType, body = '', json, headers = {} } = {}) => {
                const text = json !== undefined ? JSON.stringify(json) : body;
                result = new Response(text, { status, headers: { 'content-type': contentType || (json !== undefined ? 'application/json' : 'text/plain'), ...headers } });
            },
            abort: async () => { result = Response.error(); },
            continue: async () => { result = 'continue'; },
            fallback: async () => { result = 'fallback'; },
        });
        if (result === 'fallback' || result === null) continue;
        if (result === 'continue') break;
        return result;
    }
    return diskResponse(request.url(), env);
}

/** What a page at `startUrl` is: the blank page, or the site's own shell for any other address, as the server answers. */
function pageFor(startUrl, env) {
    if (startUrl === '/__blank') return BLANK_PAGE;
    env.record?.(CDN_ROOT + 'index.html');
    return readFileSync(CDN_ROOT + 'index.html', 'utf8');
}

/**
 * Opens a window with the loader running, and resolves once Web UI has started: loaded, its app config read, and the
 * startup roles request answered. The returned env can load the page again (reload) or another one (goto), keeping
 * the routes, listeners, and the origin's storage, as a browser tab would.
 */
export async function openWindow({ html, url, startUrl = '/__blank', setup, record } = {}) {
    const errors = [];
    const listeners = {};
    const env = {
        routes: [],
        initScripts: [],
        exposed: {},
        errors,
        record,
        emit(event, value) { (listeners[event] || []).forEach(listener => listener(value)); },
        on(event, listener) { (listeners[event] ||= []).push(listener); },
        route(pattern, handler) { env.routes.push({ pattern, handler }); },
        waitForEvent(event, predicate = () => true) {
            return new Promise(resolve => env.on(event, value => { if (predicate(value)) resolve(value); }));
        },
        async reload() {
            await load(env.html, env.window.location.href, storageOf(env.window));
        },
        async goto(target) {
            const next = new URL(target, env.window?.location.href || `${ORIGIN}/`);
            const storage = env.window && new URL(env.window.location.href).origin === next.origin ? storageOf(env.window) : null;
            await load(pageFor(next.pathname, env), next.href, storage);
        },
    };
    // Playwright calls console.warn's messages 'warning'.
    const consoleMessage = (type, args) => ({ type: () => (type === 'warn' ? 'warning' : type), text: () => args.map(arg => arg?.stack || `${arg}`).join(' '), args: () => args });
    const report = (...args) => {
        const text = args.map(arg => arg?.stack || `${arg}`).join(' ');
        if (!EXPECTED_CONSOLE.some(pattern => pattern.test(text))) errors.push(text);
    };
    const load = async (pageHtml, pageUrl, storage) => {
        env.window?.close();
        env.html = pageHtml;
        const virtualConsole = new VirtualConsole();
        for (const type of ['log', 'info', 'warn', 'debug']) virtualConsole.on(type, (...args) => env.emit('console', consoleMessage(type, args)));
        virtualConsole.on('error', (...args) => {
            env.emit('console', consoleMessage('error', args));
            // Components log errors while they handle failures, which tests cause on purpose. Only messages about
            // setting data, which mean a broken binding, fail a test, as in the browser harness.
            const text = args.map(arg => `${arg}`).join(' ');
            if (text.startsWith('Error setting data')) errors.push(text);
        });
        virtualConsole.on('jsdomError', error => {
            if (!EXPECTED_CONSOLE.some(pattern => pattern.test(`${error.message}`))) env.emit('pageerror', error);
        });
        let rolesAnswered;
        const roles = new Promise(resolve => { rolesAnswered = resolve; });
        const dom = new JSDOM(pageHtml, {
            url: pageUrl,
            runScripts: 'dangerously',
            pretendToBeVisual: true,
            virtualConsole,
            resources: { interceptors: [requestInterceptor(request => answer(env, new RouteRequest(request.url, request.method, null, headerObject(request.headers))))] },
            beforeParse(window) {
                env.page?.clock?._onWindow(window);
                if (storage) restoreStorage(window, storage);
                installStandIns(window);
                // jsdom's crypto has getRandomValues only; Node's Web Crypto stands in for the rest.
                if (!window.crypto?.subtle) Object.defineProperty(window, 'crypto', { configurable: true, value: globalThis.crypto });
                window.matchMedia = mediaMatcher(env.media);
                window.fetch = async (input, init = {}) => {
                    // Relative to the document's base address, as a browser's fetch is, not the page's.
                    const target = new URL(typeof input === 'string' ? input : input.url ?? `${input}`, window.document.baseURI).href;
                    const headers = headerObject(init.headers ?? input?.headers);
                    const body = await serializeBody(window, init.body ?? null, headers);
                    const response = await answer(env, new RouteRequest(target, init.method || input?.method || 'GET', body, headers));
                    if (response.type === 'error') throw new window.TypeError('Failed to fetch');
                    if (/\/user\/roles$/.test(new URL(target).pathname)) queueMicrotask(rolesAnswered);
                    return pageResponse(window, response);
                };
                window.Response ??= Response;
                window.Request ??= Request;
                window.Headers ??= Headers;
                const attach = window.HTMLElement.prototype.attachInternals;
                window.HTMLElement.prototype.attachInternals = function () {
                    const internals = attach.call(this);
                    const host = this;
                    internals.setFormValue ??= value => { host.__formValue = value; };
                    internals.setValidity ??= () => { };
                    // jsdom does not associate custom elements with their form, so the form is the one they sit in.
                    const nativeForm = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(internals), 'form')?.get;
                    Object.defineProperty(internals, 'form', { configurable: true, get: () => nativeForm?.call(internals) || host.closest('form') });
                    return internals;
                };
                window.addEventListener('error', event => {
                    env.emit('pageerror', event.error || new Error(event.message));
                    report(event.error || event.message);
                });
                window.addEventListener('unhandledrejection', event => {
                    const reason = event.reason;
                    if (reason instanceof window.TypeError && reason.message === 'Failed to fetch') return;
                    if (reason instanceof window.TypeError || reason instanceof window.ReferenceError || reason instanceof window.SyntaxError) report(reason);
                });
                for (const [name, fn] of Object.entries(env.exposed)) window[name] = async (...args) => fn(...args);
                for (const { source, arg } of env.initScripts) window.eval(`(${source})(${arg === undefined ? '' : JSON.stringify(arg)})`);
                setup?.(window, env);
            },
        });
        const { window } = dom;
        Object.assign(env, { dom, window, document: window.document });
        env.page?._attach(env);
        const webui = () => window.eval('typeof webui === "object" ? webui : null');
        await vi.waitFor(() => { if (!webui()?.loaded) throw new Error('Web UI did not load'); }, { timeout: 15000, interval: 5 });
        // The loader starts with a stand-in parser and swaps in the real one once its import() loads, which jsdom can't.
        webui().markdown = new MarkdownParser();
        if (pageHtml.includes('<webui-app-config')) {
            await vi.waitFor(() => { if (!webui().appConfig?.appName) throw new Error('The app config did not load'); }, { timeout: 15000, interval: 5 });
            await Promise.race([roles, new Promise(resolve => setTimeout(resolve, 250))]);
        }
        await settle(window);
    };
    env.settle = () => settle(env.window);
    await load(html ?? pageFor(startUrl, env), url ?? `${ORIGIN}${startUrl}`, null);
    return env;
}

/** A copy of a window's local and session storage, to carry into the page loaded after it. */
function storageOf(window) {
    const copy = store => Object.fromEntries(Array.from({ length: store.length }, (_, i) => store.key(i)).map(key => [key, store.getItem(key)]));
    return { local: copy(window.localStorage), session: copy(window.sessionStorage) };
}

function restoreStorage(window, storage) {
    for (const [key, value] of Object.entries(storage.local)) window.localStorage.setItem(key, value);
    for (const [key, value] of Object.entries(storage.session)) window.sessionStorage.setItem(key, value);
}

/** Lets the page act on what just happened: queued work, then two animation frames. */
export async function settle(window) {
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
}

/**
 * Vitest's `test` with Playwright-style fixtures: `page` is a fresh jsdom window on the blank page, and a test fails if
 * the page had uncaught errors. `pageOptions` (html, url, setup) can be set for a file with test.override().
 *
 * A test with a page is skipped when it passed before and nothing it depends on has changed (test-cache.mjs).
 */
export const test = base.extend({
    pageOptions: [{}, { injected: false }],
    // The site's address, as Playwright's baseURL.
    baseURL: async ({}, use) => use(ORIGIN),
    page: async ({ pageOptions, task, skip, onTestFinished }, use) => {
        const cache = cacheFor(task.file.filepath);
        const name = testName(task);
        if (cache.isFresh(name)) skip('passed before, and nothing it depends on has changed');
        const files = new Set();
        onTestFinished(({ task }) => {
            if (task.result?.state === 'pass') cache.passed(name, [...files]);
            else cache.failed(name);
        });
        const env = await openWindow({ ...pageOptions, record: file => files.add(fromRoot(resolve(file))) });
        const page = new Page(env);
        env.page = page;
        await use(page);
        page.clock.uninstall();
        env.window.close();
        // Vitest keeps each test's context until the file ends, so the window is let go here or every test's stays.
        const { errors } = env;
        page.release();
        for (const key of Object.keys(env)) delete env[key];
        // Anything the closed window still says goes nowhere.
        Object.assign(env, { closed: true, errors: [], routes: [], initScripts: [], exposed: {}, emit() { }, on() { } });
        expect(errors, 'Uncaught errors happened while this test ran').toEqual([]);
    },
});

/**
 * Puts HTML into #test-root and waits for the Web UI and app components in it to be defined and drawn. Returns a
 * locator for the root, as the browser harness did.
 */
export async function mount(page, html) {
    const { window, document } = page;
    let root = document.getElementById('test-root');
    if (!root) {
        root = document.createElement('div');
        root.id = 'test-root';
        document.body.appendChild(root);
    }
    root.innerHTML = html;
    const tags = [...new Set((html.match(/<(webui|app)-[a-z0-9-]+/g) || []).map(tag => tag.substring(1)))];
    await Promise.all(tags.map(tag => window.customElements.whenDefined(tag)));
    await page.settle();
    return new Locator(page, () => [document.getElementById('test-root')].filter(Boolean), '#test-root');
}

/** As Playwright's test.use, for the options these tests set: `startUrl` opens that page of the site instead. */
test.use = options => test.override({ pageOptions: options });

// Each test file imports this harness, so this runs once its tests are done: the file's results are saved, dropping
// tests it no longer has.
afterAll(({}, file) => {
    if (file?.filepath) cacheFor(file.filepath).save(allTestNames(file.tasks));
});
