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
    await expect.poll(() => page.locator('#webui-font-nunito').count()).toBe(1);
});
test('embeds its font once, as WOFF2', async ({ page }) => {
    await mount(page, '<webui-stoic-dreams-logo text="MyFi" text2="CDN"></webui-stoic-dreams-logo>');
    const css = await page.locator('#webui-font-nunito').evaluate(el => el.textContent);
    expect(css).toContain("format('woff2')");
    // Every browser that runs the framework reads WOFF2, so a WOFF copy only doubled the download.
    expect(css).not.toContain("format('woff')");
});
test('shows its words as text, never as markup', async ({ page }) => {
    const root = await mount(page, '<webui-stoic-dreams-logo text="<b>Bold</b>"></webui-stoic-dreams-logo>');
    const logo = root.locator('webui-stoic-dreams-logo svg.logo');
    await expect(logo.locator('.words > g')).toHaveText('<b>Bold</b>');
    await expect(logo.locator('b')).toHaveCount(0);
});
test('draws one line or two, and redraws them when the words change', async ({ page }) => {
    const root = await mount(page, '<webui-stoic-dreams-logo text="App"></webui-stoic-dreams-logo>');
    const el = root.locator('webui-stoic-dreams-logo');
    await expect(el.locator('svg.logo .words > g')).toHaveText(['App']);
    await el.evaluate(logo => logo.setAttribute('text2', 'Two'));
    await expect(el.locator('svg.logo .words > g')).toHaveText(['App', 'Two']);
    await el.evaluate(logo => logo.removeAttribute('text'));
    await expect(el.locator('svg.logo .words > g')).toHaveText(['Two']);
});
test('names itself after its words unless given a title', async ({ page }) => {
    const root = await mount(page, '<webui-stoic-dreams-logo text="Web" text2="UI"></webui-stoic-dreams-logo><webui-stoic-dreams-logo id="titled" text="Web" title="Our Logo"></webui-stoic-dreams-logo>');
    await expect(root.locator('webui-stoic-dreams-logo:not(#titled) svg.logo')).toHaveAttribute('title', 'Web UI Logo');
    await expect(root.locator('#titled svg.logo')).toHaveAttribute('title', 'Our Logo');
});
test('draws its large sphere in the site primary color', async ({ page }) => {
    // The logo's colors are its output: the Stoic Dreams pieces keep their own colors and the large sphere takes
    // the site's primary color.
    const root = await mount(page, '<div style="--color-primary:#123456"><webui-stoic-dreams-logo text="Web" text2="UI"></webui-stoic-dreams-logo></div>');
    const logo = root.locator('webui-stoic-dreams-logo svg.logo');
    await expect(logo.locator('circle[style*="--color-primary"]')).toHaveCount(1);
    await expect.poll(() => logo.locator('circle[style*="--color-primary"]').evaluate(c => getComputedStyle(c).fill)).toBe('rgb(18, 52, 86)');
});
