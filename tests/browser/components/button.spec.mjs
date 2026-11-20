import { test, expect, mount } from '../support/webui.mjs';

test('a button with an href to another site goes there when clicked', async ({ page }) => {
    await page.route('https://example.com/**', route => route.fulfill({ contentType: 'text/html', body: '<p>Other site</p>' }));
    const root = await mount(page, '<webui-button href="https://example.com/case">Read</webui-button>');
    await root.locator('webui-button').click();
    await expect(page).toHaveURL('https://example.com/case');
});
