import { test, expect, mount } from '../support/webui.mjs';

test('builds a link from its attributes', async ({ page }) => {
    const root = await mount(page, '<webui-nav-link name="About" url="/about" icon="xmark"></webui-nav-link>');
    const link = root.locator('webui-nav-link a.navlink');
    await expect(link).toHaveAttribute('href', '/about');
    await expect(link).toHaveAttribute('title', 'About');
    await expect(link.locator('span')).toHaveText('About');
    await expect(link.locator('webui-icon')).toHaveAttribute('icon', 'xmark');
});
test('clicking routes to the url', async ({ page }) => {
    const root = await mount(page, '<webui-nav-link name="About" url="/about"></webui-nav-link>');
    await root.locator('a.navlink').click();
    await expect(page).toHaveURL(/\/about$/);
});
test('the current page is highlighted and disabled', async ({ page }) => {
    const root = await mount(page, '<webui-nav-link name="A" url="/a"></webui-nav-link><webui-nav-link name="Home" url="/"></webui-nav-link>');
    const [a, home] = [root.locator('webui-nav-link').first(), root.locator('webui-nav-link').nth(1)];
    await expect(a).toHaveAttribute('data-subscribe', 'page-path:setter');
    await page.evaluate(() => webui.setData('page-path', '/a'));
    await expect(a).toHaveClass(/theme-active/);
    await expect(a.locator('a')).toHaveAttribute('disabled', 'true');
    await page.evaluate(() => webui.setData('page-path', '/root'));
    await expect(a).not.toHaveClass(/theme-active/);
    await expect(a.locator('a')).not.toHaveAttribute('disabled');
    await expect(home).toHaveClass(/theme-active/);
});
test('inner html becomes the link content', async ({ page }) => {
    const root = await mount(page, '<webui-nav-link url="/x"><b>Bold</b></webui-nav-link>');
    await expect(root.locator('webui-nav-link a b')).toHaveText('Bold');
});
test('an icon only link is named from its title, and the current page is marked', async ({ page }) => {
    const root = await mount(page, '<webui-nav-link id="docs" icon="star" url="/docs" title="Docs Manager"></webui-nav-link>');
    await expect(page.getByRole('link', { name: 'Docs Manager' })).toHaveCount(1);
    await root.locator('#docs').evaluate(el => el.setPagePath('/docs'));
    await expect(root.locator('#docs a')).toHaveAttribute('aria-current', 'page');
    await root.locator('#docs').evaluate(el => el.setPagePath('/other'));
    await expect(root.locator('#docs a')).not.toHaveAttribute('aria-current');
});
