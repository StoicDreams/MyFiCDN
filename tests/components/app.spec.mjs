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
    expect(height).toMatch(/^\d+px$/);
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
    const before = parseInt(await variable('--header-height'));
    await page.evaluate(() => {
        const block = document.createElement('div');
        block.id = 'tall';
        block.style.height = '120px';
        document.querySelector('webui-app > header').appendChild(block);
    });
    await expect.poll(async () => parseInt(await variable('--header-height'))).toBeGreaterThanOrEqual(Math.max(before, 120));
    await page.setViewportSize({ width: 900, height: 500 });
    await expect.poll(() => variable('--window-height')).toBe('500px');
    const header = parseInt(await variable('--header-height'));
    const footer = parseInt(await variable('--footer-height'));
    await expect.poll(async () => parseInt(await variable('--main-height'))).toBe(500 - header - footer);
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
