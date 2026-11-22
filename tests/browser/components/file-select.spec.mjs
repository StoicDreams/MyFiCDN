import { test, expect, mount } from '../support/webui.mjs';

test('keyboard focus on the file field shows a ring around its label', async ({ page }) => {
    // An accessibility rule, so the ring itself is checked (Websites/CLAUDE.md, What tests check).
    const root = await mount(page, '<button id="before">Before</button><webui-file-select label="Upload"></webui-file-select>');
    await root.locator('#before').focus();
    await page.keyboard.press('Tab');
    const el = root.locator('webui-file-select');
    await expect(el.locator('input')).toBeFocused();
    await expect.poll(() => el.locator('label').evaluate(l => getComputedStyle(l).outlineStyle)).toBe('solid');
});
