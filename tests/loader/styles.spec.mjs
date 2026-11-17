import { test, expect, mount } from '../support/webui.mjs';

// Rules in webui.css that every site relies on.

test('keyboard focus shows a ring, including on buttons', async ({ page }) => {
    const root = await mount(page, '<button id="first">First</button><button id="second">Second</button>');
    await root.locator('#first').focus();
    await page.keyboard.press('Tab');
    await expect(root.locator('#second')).toBeFocused();
    expect(await root.locator('#second').evaluate(el => [getComputedStyle(el).outlineStyle, getComputedStyle(el).outlineWidth])).toEqual(['solid', '2px']);
});

test('empty headings take no space and are skipped', async ({ page }) => {
    const root = await mount(page, '<h1>Title</h1><h2 id="empty"></h2><h2 id="full">Subtitle</h2>');
    await expect(root.locator('#empty')).toBeHidden();
    await expect(root.locator('#full')).toBeVisible();
});

test('every CSS variable a component uses without a fallback is defined', async () => {
    const { readFileSync, readdirSync } = await import('node:fs');
    const dir = new URL('../../cdn/webui/', import.meta.url);
    const css = readFileSync(new URL('../../cdn/css/webui.css', import.meta.url), 'utf8');
    const defined = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
    const missing = [];
    for (const file of readdirSync(dir).filter(f => f.endsWith('.js') && !f.endsWith('.min.js'))) {
        const source = readFileSync(new URL(file, dir), 'utf8');
        // A component may set its own variables, by name in its styles or with setProperty.
        const own = new Set([...source.matchAll(/(--[\w-]+)\s*:|['"`](--[\w-]+)['"`]/g)].map(m => m[1] || m[2]));
        for (const [, name] of source.matchAll(/var\((--[\w-]+)\)/g)) {
            if (!defined.has(name) && !own.has(name)) missing.push(`${file}: ${name}`);
        }
    }
    expect([...new Set(missing)]).toEqual([]);
});

test('no framework component links the whole stylesheet into its shadow DOM', async () => {
    const { readFileSync, readdirSync } = await import('node:fs');
    const dir = new URL('../../cdn/webui/', import.meta.url);
    const linking = readdirSync(dir)
        .filter(f => f.endsWith('.js') && !f.endsWith('.min.js') && f !== 'loader.js')
        .filter(f => /linkCss\s*:/.test(readFileSync(new URL(f, dir), 'utf8')));
    expect(linking).toEqual([]);
});

test.describe('elements that are not defined yet', () => {
    test.use({ startUrl: '/about' });
    test('are hidden in the app, but elements a browser extension adds to the page are not', async ({ page }) => {
        await expect(page.locator('webui-app main')).toBeVisible();
        const opacity = await page.evaluate(() => {
            // As a password manager adds its save bar, to the page root or the body.
            const onRoot = document.createElement('bit-notification-bar-root');
            document.documentElement.appendChild(onRoot);
            const onBody = document.createElement('com-1password-menu');
            document.body.appendChild(onBody);
            // An element that is not a Web UI component, so the loader leaves it undefined.
            const inApp = document.createElement('x-pending');
            document.querySelector('webui-app').appendChild(inApp);
            return [onRoot, onBody, inApp].map(el => getComputedStyle(el).opacity);
        });
        expect(opacity).toEqual(['1', '1', '0']);
    });
});
