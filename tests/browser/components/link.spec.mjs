import { test, expect, mount } from '../support/webui.mjs';

test('keyboard focus on a link shows a ring', async ({ page }) => {
    // An accessibility rule, so the ring itself is checked (Websites/CLAUDE.md, What tests check).
    const root = await mount(page, '<button id="before">Before</button><webui-link href="/about">About</webui-link>');
    await root.locator('#before').focus();
    await page.keyboard.press('Tab');
    const link = root.getByRole('link', { name: 'About' });
    await expect(link).toBeFocused();
    await expect.poll(() => link.evaluate(el => [getComputedStyle(el).outlineStyle, getComputedStyle(el).outlineWidth])).toEqual(['solid', '2px']);
});
