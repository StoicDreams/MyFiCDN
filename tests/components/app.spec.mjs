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
test('page title comes from page data', async ({ page }) => {
    await page.evaluate(() => { webui.setData('page-title', 'Hello'); webui.setData('page-subtitle', 'There'); });
    await expect(page).toHaveTitle('Hello: There');
    await expect(page.locator('h1')).toHaveText('Hello');
});
