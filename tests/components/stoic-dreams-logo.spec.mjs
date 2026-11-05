import { test, expect, mount } from '../support/webui.mjs';

test('draws the logo with its text', async ({ page }) => {
    const root = await mount(page, '<webui-stoic-dreams-logo text="MyFi" text2="CDN" title="Logo"></webui-stoic-dreams-logo>');
    const el = root.locator('webui-stoic-dreams-logo');
    await expect(el.locator('svg.logo')).toBeAttached();
    await expect(el.locator('svg.logo')).toContainText('MyFi');
    await expect(el.locator('svg.logo')).toContainText('CDN');
});
test('adds its font once', async ({ page }) => {
    await mount(page, '<webui-stoic-dreams-logo></webui-stoic-dreams-logo><webui-stoic-dreams-logo></webui-stoic-dreams-logo>');
    expect(await page.locator('#webui-font-nunito').count()).toBe(1);
});
