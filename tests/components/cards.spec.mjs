import { test, expect, mount } from '../support/webui.mjs';

test('setCards builds cards from json or arrays', async ({ page }) => {
    const root = await mount(page, '<webui-cards theme="info"></webui-cards>');
    const cards = root.locator('webui-cards');
    await cards.evaluate(el => el.setCards('[{"name":"One","body":"**b**","class":"x y"},{"name":"Two","theme":"danger","link":"/l","width":100,"avatar":"AB","elevation":3}]'));
    await expect(cards.locator('webui-card')).toHaveCount(2);
    await expect(cards.locator('webui-card').first()).toHaveAttribute('theme', 'info');
    await expect(cards.locator('webui-card').first()).toHaveClass(/x y/);
    await expect(cards.locator('webui-card strong')).toHaveText('b');
    await cards.evaluate(el => el.setCards([{ name: 'Array' }]));
    await expect(cards.locator('webui-card')).toHaveCount(1);
});
test('bad json shows an error', async ({ page }) => {
    const root = await mount(page, '<webui-cards></webui-cards>');
    await root.locator('webui-cards').evaluate(el => el.setCards('{bad'));
    await expect(root.locator('webui-cards')).toContainText('Error parsing card information');
});
test('src loads cards', async ({ page }) => {
    await page.route('**/cards-test.json', route => route.fulfill({ contentType: 'application/json', body: '[{"name":"Loaded"}]' }));
    const root = await mount(page, '<webui-cards src="/cards-test.json"></webui-cards>');
    await expect(root.locator('webui-card header section')).toHaveText('Loaded');
});
test('card-width sets the grid and existing cards', async ({ page }) => {
    const root = await mount(page, '<webui-cards card-width="200"><webui-card></webui-card></webui-cards>');
    const cards = root.locator('webui-cards');
    expect(await cards.evaluate(el => el.style.gridTemplateColumns)).toContain('200px');
    await cards.evaluate(el => el.setAttribute('card-width', '300'));
    await expect(cards.locator('webui-card')).toHaveAttribute('width', '300');
});
