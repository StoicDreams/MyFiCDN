import { test, expect, mount } from '../support/webui.mjs';

// Rules in webui.css that every site relies on.

test('keyboard focus shows a ring, including on buttons', async ({ page }) => {
    // An accessibility rule, so the ring itself is checked (Websites/CLAUDE.md, What tests check).
    const root = await mount(page, '<button id="first">First</button><button id="second">Second</button>');
    await root.locator('#first').focus();
    await page.keyboard.press('Tab');
    await expect(root.locator('#second')).toBeFocused();
    expect(await root.locator('#second').evaluate(el => [getComputedStyle(el).outlineStyle, getComputedStyle(el).outlineWidth])).toEqual(['solid', '2px']);
});

test.describe('elements that are not defined yet', () => {
    test.use({ startUrl: '/about' });
    test('are hidden in the app, but elements a browser extension adds to the page are not', async ({ page }) => {
        await expect(page.locator('webui-app main')).toBeVisible();
        const opacity = await page.evaluate(() => {
            // As a password manager adds its save bar, to the page root or the body.
            const onRoot = document.createElement('bit-notification-bar-root');
            document.documentElement.appendChild(onRoot);
            const onBody = document.createElement('com-1password-menu');
            document.body.appendChild(onBody);
            // An element that is not a Web UI component, so the loader leaves it undefined.
            const inApp = document.createElement('x-pending');
            document.querySelector('webui-app').appendChild(inApp);
            return [onRoot, onBody, inApp].map(el => getComputedStyle(el).opacity);
        });
        expect(opacity).toEqual(['1', '1', '0']);
    });
});
