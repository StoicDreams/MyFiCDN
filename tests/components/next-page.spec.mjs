import { test, expect, mount } from '../support/webui.mjs';

test('shows a button to the next page', async ({ page }) => {
    const root = await mount(page, '<webui-next-page></webui-next-page>');
    const el = root.locator('webui-next-page');
    await el.evaluate(c => c.setValue({ name: 'Home', href: '/home' }));
    const button = el.locator('.next-page-link webui-button');
    await expect(button).toContainText('Continue to Home');
    await expect(button).toHaveAttribute('href', '/home');
});
test('hides when there is no next page', async ({ page }) => {
    const root = await mount(page, '<webui-next-page></webui-next-page>');
    const el = root.locator('webui-next-page');
    await el.evaluate(c => c.setValue({ name: 'Home' }));
    await expect(el.locator('webui-button')).toBeAttached();
    await page.waitForTimeout(350);
    await el.evaluate(c => c.setValue(null));
    await expect(el).toBeHidden();
    await expect(el.locator('webui-button')).toHaveCount(0);
});
test('data subscriptions fill its sections and set the page', async ({ page }) => {
    const root = await mount(page, '<webui-next-page data-subscribe="page-next-page"></webui-next-page>');
    const el = root.locator('webui-next-page');
    await page.evaluate(() => {
        webui.setData('next-page-pre', 'Before');
        webui.setData('next-page-post', 'After');
        webui.setData('page-next-page', { name: 'Docs', href: '/docs' });
    });
    await expect(el.locator('webui-flex.next-page-pre')).toContainText('Before');
    await expect(el.locator('webui-flex.next-page-post')).toContainText('After');
    await expect(el.locator('webui-button')).toContainText('Continue to Docs');
});
