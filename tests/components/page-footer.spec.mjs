import { test, expect, mount } from '../support/webui.mjs';

const year = new Date().getFullYear();
const footer = page => mount(page, '<div id="host"><webui-page-footer copyright="2020" company="Acme"><p>Links {APP_NAME}</p></webui-page-footer></div>');

test('moves its content into footers and removes itself', async ({ page }) => {
    const root = await footer(page);
    await expect(root.locator('webui-page-footer')).toHaveCount(0);
    await expect(root.locator('#host > footer[slot="footer"] webui-poweredby')).toBeAttached();
    await expect(root.locator('#host > footer[slot="content-footer"]')).toContainText('Links My Fidelity CDN');
});
test('copyright shows the year range and company', async ({ page }) => {
    const root = await footer(page);
    await expect(root.locator('footer[slot="footer"] webui-paper')).toContainText(`© 2020-${year} Acme All Rights Reserved`);
});
test('a copyright of this year shows one year, and short years are expanded', async ({ page }) => {
    const root = await mount(page, `<div id="a"><webui-page-footer copyright="${year}" company="A"></webui-page-footer></div><div id="b"><webui-page-footer copyright="20" company="B"></webui-page-footer></div>`);
    await expect(root.locator('#a webui-paper')).toHaveText(`© ${year} A All Rights Reserved`);
    await expect(root.locator('#b webui-paper')).toHaveText(`© 2020-${year} B All Rights Reserved`);
});
test.describe('on a narrow phone', () => {
    // The footer is the same on every page, so a light page keeps the test quick on a busy machine.
    test.use({ startUrl: '/about' });
    for (const width of [220, 260, 300]) {
        test(`at ${width}px, the copyright wraps and all of it stays on screen`, async ({ page }) => {
            await page.setViewportSize({ width, height: 700 });
            const copyright = page.locator('webui-app footer[slot="footer"] webui-paper');
            await expect(copyright).toContainText('All Rights Reserved');
            await expect(copyright).toBeInViewport({ ratio: 1 });
            await expect(copyright.getByText(/^©/)).toBeInViewport({ ratio: 1 });
            await expect(copyright.getByText('All Rights Reserved')).toBeInViewport({ ratio: 1 });
            await expect(page.locator('webui-app footer[slot="footer"] webui-poweredby')).toBeInViewport({ ratio: 1 });
        });
    }
});
