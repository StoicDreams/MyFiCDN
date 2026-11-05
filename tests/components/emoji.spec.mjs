import { test, expect, mount } from '../support/webui.mjs';

test('displays the named emoji', async ({ page }) => {
    const root = await mount(page, '<webui-emoji emoji="grinning"></webui-emoji>');
    await expect(root.locator('webui-emoji')).not.toHaveText('');
});
test('downloads the emoji map once, only when first needed', async ({ page }) => {
    let requests = 0;
    page.on('request', request => { if (request.url().includes('emojis.json')) requests++; });
    const root = await mount(page, '<webui-emoji></webui-emoji>');
    await page.waitForTimeout(100);
    expect(requests).toBe(0);
    await root.locator('webui-emoji').evaluate(el => el.setAttribute('emoji', 'grinning'));
    await expect(root.locator('webui-emoji')).not.toHaveText('');
    await mount(page, '<webui-emoji emoji="house"></webui-emoji><webui-emoji emoji="gear"></webui-emoji>');
    await expect(root.locator('webui-emoji').nth(1)).not.toHaveText('');
    expect(requests).toBe(1);
});
test('an unknown emoji stays empty and logs the problem', async ({ page }) => {
    const logged = page.waitForEvent('console', m => m.text().includes('Emoji map is missing'));
    const root = await mount(page, '<webui-emoji emoji="not-a-real-emoji"></webui-emoji>');
    await logged;
    await expect(root.locator('webui-emoji')).toHaveText('');
});
test('height sets both dimensions', async ({ page }) => {
    const root = await mount(page, '<webui-emoji height="20"></webui-emoji>');
    expect(await root.locator('webui-emoji').evaluate(el => [el.style.height, el.style.width])).toEqual(['20px', '20px']);
});
