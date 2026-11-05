import { test, expect, mount } from '../support/webui.mjs';

test('redirects home when required data is missing', async ({ page }) => {
    const calls = await page.evaluate(async () => {
        await new Promise(r => { const d = document.createElement('webui-page-requires'); d.dataset.subscribe = 'pr-missing'; document.body.appendChild(d); customElements.whenDefined('webui-page-requires').then(r); });
        return 0;
    });
    expect(calls).toBe(0);
    await page.evaluate(() => { webui.setData('pr-missing', 'x'); });
    await page.evaluate(() => webui.setData('pr-missing', ''));
    await expect(page).toHaveURL(/\/$/);
});
test('stays put while the data has a value', async ({ page }) => {
    await page.evaluate(() => webui.setData('pr-ok', 'yes'));
    await mount(page, '<webui-page-requires data-subscribe="pr-ok"></webui-page-requires>');
    await page.waitForTimeout(100);
    await expect(page).toHaveURL(/__blank/);
});
