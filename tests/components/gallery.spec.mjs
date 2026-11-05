import { test, expect, mount } from '../support/webui.mjs';

test('shows the first image and switches when a card is clicked', async ({ page }) => {
    await page.route('**/gallery-test.json', route => route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([{ name: 'One', src: '/a.png' }, { name: 'Two', src: '/b.png' }]),
    }));
    const root = await mount(page, '<webui-gallery src="/gallery-test.json" card-width="100"></webui-gallery>');
    const image = root.locator('webui-flex img');
    await expect(image).toHaveAttribute('src', '/a.png');
    await expect(root.locator('webui-cards webui-card')).toHaveCount(2);
    await expect(root.locator('webui-flex p')).toHaveText('One');
    await root.locator('webui-card').nth(1).evaluate(card => card.click());
    await expect(image).toHaveAttribute('src', '/b.png');
    await expect(root.locator('webui-flex p')).toHaveText('Two');
});
test('an empty or failed source shows nothing', async ({ page }) => {
    await page.route('**/gallery-empty.json', route => route.fulfill({ contentType: 'application/json', body: '[]' }));
    const root = await mount(page, '<webui-gallery src="/gallery-empty.json"></webui-gallery><webui-gallery src="/missing.json"></webui-gallery>');
    await page.waitForTimeout(150);
    await expect(root.locator('webui-cards')).toHaveCount(0);
});
