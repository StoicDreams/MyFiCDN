import { test, expect, mount } from '../support/webui.mjs';

const search = async page => {
    const root = await mount(page, '<webui-emoji-search></webui-emoji-search>');
    const el = root.locator('webui-emoji-search');
    await expect(el.locator('.grid a').first()).toBeVisible();
    return el;
};

test('lists one page of emojis', async ({ page }) => {
    const el = await search(page);
    await expect(el.locator('.grid a')).toHaveCount(20);
    expect(await el.evaluate(c => c.pageCount)).toBeGreaterThan(1);
});
test('search filters the list', async ({ page }) => {
    const el = await search(page);
    const total = await el.evaluate(c => c.totalCount);
    await el.locator('[label="Search"] input').fill('grinning');
    await expect.poll(() => el.evaluate(c => c.totalCount)).toBeLessThan(total);
    await expect(el.locator('.grid a').first()).toHaveAttribute('title', /grinning/);
});
test('clicking an emoji copies its code', async ({ page }) => {
    const el = await search(page);
    await page.evaluate(() => {
        Object.defineProperty(navigator, 'clipboard', { value: { writeText: async v => { window.__copied = v; } }, configurable: true });
    });
    const first = el.locator('.grid a').first();
    await first.evaluate(a => a.click());
    await expect.poll(() => page.evaluate(() => window.__copied)).toMatch(/^:.+:$/);
});
