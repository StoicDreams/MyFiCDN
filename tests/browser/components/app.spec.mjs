import { test, expect, mount } from '../support/webui.mjs';

test.use({ startUrl: '/about' });

// Page content arrives after startup, so tests that change it must wait for that to finish.
test.beforeEach(async ({ page }) => {
    await expect(page.locator('webui-app > webui-page-segment').first()).toBeVisible();
    await expect(page.locator('webui-app main')).not.toHaveClass(/transition/);
});

test('lays out the site and loads the page', async ({ page }) => {
    await expect(page.locator('webui-app main')).toBeVisible();
    await expect(page.locator('h1')).not.toHaveText('');
    await expect(page.locator('webui-app > webui-page-segment').first()).toBeVisible();
});
test('dialogs are added to the page body, outside the app shadow root', async ({ page }) => {
    await expect(page.locator('body > webui-dialogs')).toHaveCount(1);
    await expect.poll(() => page.evaluate(() => document.querySelector('webui-app').shadowRoot.querySelector('webui-dialogs'))).toBe(null);
});
test('applyDynamicStyles publishes layout sizes and a width class', async ({ page }) => {
    await page.evaluate(() => webui.applyDynamicStyles());
    const [width, height, body] = await page.evaluate(() => {
        const style = document.documentElement.style;
        return [style.getPropertyValue('--window-width'), style.getPropertyValue('--main-height'), document.body.className];
    });
    expect(width).toBe(`${page.viewportSize().width}px`);
    expect(height).toMatch(/^\d+(\.\d+)?px$/);
    expect(body).toMatch(/w-(hd|tab|mob|hdp|fhd|qhd|wqhd|4k)/);
});
test('setPageContent replaces only the page content', async ({ page }) => {
    await page.evaluate(() => webui._appSettings.app.setPageContent('<p id="one">1</p><p id="two">2</p>'));
    await expect(page.locator('webui-app > #one')).toHaveText('1');
    await expect(page.locator('webui-app > #two')).toHaveText('2');
    await expect(page.locator('webui-app > header')).toBeVisible();
    await page.evaluate(() => webui._appSettings.app.setPageContent('<p id="three">3</p>'));
    await expect(page.locator('webui-app > #one')).toHaveCount(0);
});
test('the footer still shows when the page loads before the footer component', async ({ page }) => {
    // The footer component is held back until the page has loaded.
    let release;
    const held = new Promise(resolve => { release = resolve; });
    await page.route('**/webui/page-footer.*', async route => {
        await held;
        await route.fallback();
    });
    await page.goto('/about');
    await expect(page.locator('webui-app > webui-page-segment').first()).toBeVisible();
    await expect(page.locator('webui-app main')).not.toHaveClass(/transition/);
    release();
    await expect(page.locator('webui-app > footer[slot="footer"] webui-poweredby')).toBeAttached();
});
test('page title comes from page data', async ({ page }) => {
    await page.evaluate(() => { webui.setData('page-title', 'Hello'); webui.setData('page-subtitle', 'There'); });
    await expect(page).toHaveTitle('Hello: There');
    await expect(page.locator('h1')).toHaveText('Hello');
});
test('layout size variables follow the header and the window', async ({ page }) => {
    const variable = name => page.evaluate(n => document.documentElement.style.getPropertyValue(n), name);
    const before = parseFloat(await variable('--header-height'));
    await page.evaluate(() => {
        const block = document.createElement('div');
        block.id = 'tall';
        block.style.height = '120px';
        document.querySelector('webui-app > header').appendChild(block);
    });
    await expect.poll(async () => parseFloat(await variable('--header-height'))).toBeGreaterThanOrEqual(Math.max(before, 120));
    await page.setViewportSize({ width: 900, height: 500 });
    await expect.poll(() => variable('--window-height')).toBe('500px');
    const header = parseFloat(await variable('--header-height'));
    const footer = parseFloat(await variable('--footer-height'));
    await expect.poll(async () => parseFloat(await variable('--main-height'))).toBeCloseTo(500 - header - footer, 3);
});
test('a header with a border, or a height that is not a whole number of pixels, leaves the app fitting the window, with nothing to scroll', async ({ page }) => {
    await page.evaluate(() => {
        const block = document.createElement('div');
        block.style.height = '49.9px';
        const header = document.querySelector('webui-app > header');
        header.style.borderBottom = '1px solid';
        header.replaceChildren(block);
    });
    const app = page.locator('webui-app');
    await expect.poll(() => app.evaluate(el => el.scrollHeight - el.clientHeight)).toBe(0);
    // Asked to scroll, it stays where it is, so the header never shifts by a pixel.
    await expect.poll(() => app.evaluate(el => { el.scrollTop = 5; return el.scrollTop; })).toBe(0);
});
for (const width of [360, 375]) {
    test(`on a ${width}px phone, wide page content scrolls inside main and the page does not scroll sideways`, async ({ page }) => {
        await page.setViewportSize({ width, height: 700 });
        await page.evaluate(() => webui._appSettings.app.setPageContent('<p id="narrow">Short text</p><div id="wide" style="width:600px">Wide content</div>'));
        await expect(page.locator('webui-app > #wide')).toBeAttached();
        // Trying to scroll the page sideways leaves it where it is.
        await expect.poll(() => page.evaluate(() => { window.scrollTo(400, window.scrollY); return window.scrollX; })).toBe(0);
        // Text that can wrap shows whole; only content that cannot shrink scrolls, inside main.
        await expect(page.locator('#narrow')).toBeInViewport({ ratio: 1 });
        await expect.poll(() => page.evaluate(() => {
            const main = document.querySelector('webui-app').shadowRoot.querySelector('main');
            main.scrollLeft = 100000;
            return main.scrollLeft > 0;
        })).toBe(true);
    });
}
test('the content footer is marked empty without content, and shows when it has some', async ({ page }) => {
    const slot = () => page.evaluate(() => {
        const slot = document.querySelector('webui-app').shadowRoot.querySelector('slot[name="content-footer"]');
        return { empty: slot.hasAttribute('empty'), assigned: slot.assignedNodes().length };
    });
    const before = await slot();
    if (before.assigned) {
        expect(before).toMatchObject({ empty: false });
        await page.evaluate(() => document.querySelectorAll('webui-app > [slot="content-footer"]').forEach(el => el.remove()));
    }
    await expect.poll(slot).toMatchObject({ empty: true });
    await page.evaluate(() => document.querySelector('webui-app').append(Object.assign(document.createElement('footer'), { slot: 'content-footer', textContent: 'Links' })));
    await expect.poll(slot).toMatchObject({ empty: false });
    await expect(page.locator('webui-app > footer[slot="content-footer"]')).toBeVisible();
});
test('side drawers run the full height: docked, the bottom slot sits between them, and open over the page, they cover it', async ({ page }) => {
    await page.setViewportSize({ width: 1300, height: 700 });
    await page.evaluate(() => {
        const bar = document.createElement('div');
        bar.slot = 'bottom';
        bar.id = 'bar';
        bar.style.cssText = 'height:40px;display:flex;justify-content:space-between;align-items:center;';
        bar.innerHTML = '<button id="bar-start">Start</button><button id="bar-end">End</button>';
        document.querySelector('webui-app').appendChild(bar);
        document.querySelector('webui-app > webui-drawer[slot="left"]').setAttribute('docked', 'true');
    });
    const left = page.locator('webui-app > webui-drawer[slot="left"]');
    await expect(left).toHaveAttribute('docked', 'true');
    // What a click at the bottom of the window reaches: the docked drawer runs the full height beside the bar.
    const hitAtBottom = x => page.evaluate(x => {
        const el = document.elementFromPoint(x, window.innerHeight - 4);
        return el?.closest('webui-drawer') ? 'drawer' : el?.closest('#bar') ? 'bar' : el?.localName;
    }, x);
    const box = await left.boundingBox();
    await expect.poll(() => hitAtBottom(box.x + 10)).toBe('drawer');
    // Real clicks, which Playwright refuses when something covers what is clicked.
    await page.locator('#bar-start').click();
    await page.locator('#bar-end').click();
    // A drawer open over the page runs the full height, over the bar too, with its own buttons on top.
    const right = page.locator('webui-app > webui-drawer.shared');
    await right.evaluate(drawer => {
        drawer.setAttribute('data-dockable', '');
        drawer.classList.add('open');
    });
    await expect(right).toHaveClass(/open/);
    await expect(right).not.toHaveAttribute('docked');
    const end = await page.locator('#bar-end').boundingBox();
    await expect.poll(() => page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest('webui-drawer.shared'), { x: end.x + end.width / 2, y: end.y + end.height / 2 })).toBe(true);
    await right.locator('[slot="footer"] .drawer-close').click();
    await expect(right).not.toHaveClass(/open/);
});
test('page-content and page-data name where pages and their data load from', async ({ page }) => {
    // Later routes win in Playwright, so these answer before the harness serves from disk.
    await page.route('**/alt-content/contact.md', route => route.fulfill({ contentType: 'text/markdown', body: '<webui-data data-page-title="From Alt"></webui-data>\n\nAlt content page' }));
    const dataRequests = [];
    await page.route('**/alt-data/**', route => { dataRequests.push(new URL(route.request().url()).pathname); return route.fulfill({ contentType: 'application/json', body: '{}' }); });
    await page.evaluate(() => {
        const app = document.querySelector('webui-app');
        app.setAttribute('page-content', '/alt-content');
        app.setAttribute('page-data', '/alt-data');
        app.setAttribute('page-data-encrypt', '');
        webui.navigateTo('/contact');
    });
    await expect(page.locator('webui-app')).toContainText('Alt content page');
    await expect.poll(() => dataRequests).toEqual(['/alt-data/contact']);
});
