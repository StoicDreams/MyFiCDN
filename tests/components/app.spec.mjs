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
    await page.route('**/webui/page-footer.*', async route => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.fallback();
    });
    await page.goto('/about');
    await expect(page.locator('webui-app > webui-page-segment').first()).toBeVisible();
    await expect(page.locator('webui-app > footer[slot="footer"] webui-poweredby')).toBeAttached({ timeout: 10000 });
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
    test(`main stays inside a ${width}px phone window when page content is wide`, async ({ page }) => {
        await page.setViewportSize({ width, height: 700 });
        await page.evaluate(() => webui._appSettings.app.setPageContent('<p id="narrow">Short text</p><div id="wide" style="width:600px">Wide content</div>'));
        await expect(page.locator('webui-app > #wide')).toBeAttached();
        await expect.poll(() => page.evaluate(() => {
            const main = document.querySelector('webui-app').shadowRoot.querySelector('main');
            return Math.round(main.getBoundingClientRect().right);
        })).toBeLessThanOrEqual(width);
        // Text that can wrap fits the window; only content that cannot shrink scrolls inside main.
        const right = await page.evaluate(() => ({
            app: document.querySelector('webui-app').getBoundingClientRect().right,
            narrow: document.getElementById('narrow').getBoundingClientRect().right,
        }));
        expect(right.app).toBeLessThanOrEqual(width);
        expect(right.narrow).toBeLessThanOrEqual(width);
    });
}
test('the content footer takes no space without content, and shows when it has some', async ({ page }) => {
    const slot = () => page.evaluate(() => {
        const slot = document.querySelector('webui-app').shadowRoot.querySelector('slot[name="content-footer"]');
        return { empty: slot.hasAttribute('empty'), display: getComputedStyle(slot).display, assigned: slot.assignedNodes().length };
    });
    const before = await slot();
    if (before.assigned) {
        expect(before).toMatchObject({ empty: false, display: 'grid' });
        await page.evaluate(() => document.querySelectorAll('webui-app > [slot="content-footer"]').forEach(el => el.remove()));
    }
    await expect.poll(slot).toMatchObject({ empty: true, display: 'none' });
    await page.evaluate(() => document.querySelector('webui-app').append(Object.assign(document.createElement('footer'), { slot: 'content-footer', textContent: 'Links' })));
    await expect.poll(slot).toMatchObject({ empty: false, display: 'grid' });
});
