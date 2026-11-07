import { test, expect, mount } from '../support/webui.mjs';

// Rules in webui.css that every site relies on.

test('keyboard focus shows a ring, including on buttons', async ({ page }) => {
    const root = await mount(page, '<button id="first">First</button><button id="second">Second</button>');
    await root.locator('#first').focus();
    await page.keyboard.press('Tab');
    await expect(root.locator('#second')).toBeFocused();
    expect(await root.locator('#second').evaluate(el => [getComputedStyle(el).outlineStyle, getComputedStyle(el).outlineWidth])).toEqual(['solid', '2px']);
});

test('empty headings take no space and are skipped', async ({ page }) => {
    const root = await mount(page, '<h1>Title</h1><h2 id="empty"></h2><h2 id="full">Subtitle</h2>');
    await expect(root.locator('#empty')).toBeHidden();
    await expect(root.locator('#full')).toBeVisible();
});
