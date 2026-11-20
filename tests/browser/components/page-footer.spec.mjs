import { test, expect, mount } from '../support/webui.mjs';

const year = new Date().getFullYear();
const footer = page => mount(page, '<div id="host"><webui-page-footer copyright="2020" company="Acme"><p>Links {APP_NAME}</p></webui-page-footer></div>');

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
