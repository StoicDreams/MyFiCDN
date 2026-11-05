import { test, expect, mount } from '../support/webui.mjs';

test('links to Web UI and reports its version', async ({ page }) => {
    const root = await mount(page, '<webui-poweredby></webui-poweredby>');
    const el = root.locator('webui-poweredby');
    await expect(el.locator('a')).toHaveAttribute('href', 'https://webui.stoicdreams.com');
    await expect(el).toHaveAttribute('version', /^\d+\.\d+\.\d+$/);
    const version = await el.getAttribute('version');
    expect(await page.evaluate(() => webui.getData('webui-version'))).toBe(version);
    await expect(el.locator('a')).toHaveAttribute('title', `Web UI version ${version}`);
});
test('matches the version file', async ({ page }) => {
    const root = await mount(page, '<webui-poweredby></webui-poweredby>');
    const version = await page.evaluate(() => fetch('/webui/version').then(r => r.text()));
    await expect(root.locator('webui-poweredby')).toHaveAttribute('version', version.trim());
});
