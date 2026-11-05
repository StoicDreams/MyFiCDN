import { test, expect, mount } from '../support/webui.mjs';

const routes = [
    { name: 'Home', url: '/', icon: 'house' },
    { name: 'Group', children: [{ name: 'Child', url: '/child' }] },
    { name: 'Admin', url: '/admin', role: 4 },
];

test('builds links and groups from data', async ({ page }) => {
    const root = await mount(page, '<webui-nav></webui-nav>');
    const nav = root.locator('webui-nav');
    await nav.evaluate((c, routes) => c.buildNav(routes), routes);
    await expect(nav.locator(':scope > webui-nav-link')).toHaveCount(1);
    await expect(nav.locator(':scope > webui-nav-group webui-nav-link')).toHaveAttribute('url', '/child');
    await expect(nav.locator('webui-nav-link[url="/"]')).toHaveAttribute('icon', 'house');
});
test('routes load from a url, and json text works', async ({ page }) => {
    await page.route('**/nav-test.json', route => route.fulfill({ contentType: 'application/json', body: '[{"name":"Loaded","url":"/l"}]' }));
    const root = await mount(page, '<webui-nav routes="/nav-test.json"></webui-nav>');
    await expect(root.locator('webui-nav-link')).toHaveAttribute('url', '/l');
    await root.locator('webui-nav').evaluate(c => c.buildNav('[{"name":"Text","url":"/t"}]'));
    await expect(root.locator('webui-nav-link')).toHaveAttribute('url', '/t');
});
test('links with a role only show for users with that role', async ({ page }) => {
    const root = await mount(page, '<webui-nav></webui-nav>');
    const nav = root.locator('webui-nav');
    await nav.evaluate((c, routes) => c.buildNav(routes), routes);
    await expect(nav.locator('webui-nav-link[url="/admin"]')).toHaveCount(0);
    await page.evaluate(() => webui.setData('session-user-role', 1));
    await page.waitForTimeout(50);
    await expect(nav.locator('webui-nav-link[url="/admin"]')).toHaveCount(0);
    await page.evaluate(() => webui.setData('session-user-role', 5));
    await expect(nav.locator('webui-nav-link[url="/admin"]')).toHaveCount(1);
});
test('a user already signed in sees role links on first build', async ({ page }) => {
    await page.evaluate(() => webui.setData('session-user-role', 4));
    const root = await mount(page, '<webui-nav></webui-nav>');
    await page.waitForFunction(() => document.querySelector('webui-nav')?.userRole === 4);
    await root.locator('webui-nav').evaluate((c, routes) => c.buildNav(routes), routes);
    await expect(root.locator('webui-nav-link[url="/admin"]')).toHaveCount(1);
});
test('open groups are remembered', async ({ page }) => {
    const root = await mount(page, '<webui-nav></webui-nav>');
    const nav = root.locator('webui-nav');
    await nav.evaluate((c, routes) => c.buildNav(routes), routes);
    await nav.locator('webui-nav-group button.navlink').click();
    await expect.poll(() => page.evaluate(() => webui.getData('session-nav-show'))).toEqual({ Group: true });
    await nav.evaluate(c => c._buildNav());
    await expect.poll(() => nav.locator('webui-nav-group').evaluate(g => g.isOpen)).toBe(true);
});
test('does not load the unused fa component', async ({ page }) => {
    await mount(page, '<webui-nav></webui-nav>');
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => customElements.get('webui-fa'))).toBeUndefined();
});
