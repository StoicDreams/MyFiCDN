import { test, expect, mount } from '../support/webui.mjs';

const themes = `
    <option value="" data-colors="#111111 #ff0000">Default</option>
    <option value="stone" data-colors="#222222 #c9a46a #e8e4dc">Stone</option>
    <option value="paper" data-colors="#f4f1e9 #2f5d8a">Paper</option>`;
const styles = `<style>:root[data-theme="stone"] { --color-background: rgb(34, 34, 34); }</style>`;

test('the button opens the themes in a dialog when there is no drawer', async ({ page }) => {
    const root = await mount(page, `${styles}<webui-dialogs></webui-dialogs><webui-theme-selector title="Choose a theme">${themes}</webui-theme-selector>`);
    const button = root.locator('webui-theme-selector:not([panel])');
    await expect(button).toHaveAttribute('role', 'button');
    await expect(button).toHaveAttribute('aria-label', 'Choose a theme');
    await button.click();
    const panel = page.locator('webui-theme-selector[panel]');
    await expect(panel.getByRole('button')).toHaveText(['Default', 'Stone', 'Paper']);
    await expect(panel.getByRole('button', { name: 'Default' })).toHaveAttribute('aria-pressed', 'true');
});

test('choosing a theme sets data-theme on the page and saves it', async ({ page }) => {
    const root = await mount(page, `${styles}<webui-dialogs></webui-dialogs><webui-theme-selector>${themes}</webui-theme-selector>`);
    await root.locator('webui-theme-selector').click();
    const panel = page.locator('webui-theme-selector[panel]');
    await panel.getByRole('button', { name: 'Stone' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'stone');
    await expect(panel.getByRole('button', { name: 'Stone' })).toHaveAttribute('aria-pressed', 'true');
    await expect(panel.getByRole('button', { name: 'Default' })).toHaveAttribute('aria-pressed', 'false');
    expect(await page.evaluate(() => webui.getData('session-theme'))).toBe('stone');
    await panel.getByRole('button', { name: 'Default' }).click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /./);
    expect(await page.evaluate(() => webui.getData('session-theme'))).toBe('');
});

test('each theme shows its color swatches', async ({ page }) => {
    const root = await mount(page, `<webui-theme-selector panel>${themes}</webui-theme-selector>`);
    const swatches = root.locator('button[data-theme-value="stone"] .swatch');
    await expect(swatches).toHaveCount(3);
    await expect(swatches.nth(1)).toHaveCSS('background-color', 'rgb(201, 164, 106)');
});

test('the button opens the themes in the drawer named by data-toggleclass, and closes it again', async ({ page }) => {
    const root = await mount(page, `<webui-drawer class="shared" data-stopclick></webui-drawer><webui-theme-selector data-toggleclass=".shared|open" data-title="Site theme">${themes}</webui-theme-selector>`);
    const drawer = root.locator('webui-drawer.shared');
    const button = root.locator('webui-theme-selector:not([panel])');
    // The open drawer covers the bare test page, so the clicks are dispatched to the button directly.
    await button.dispatchEvent('click');
    await expect(drawer).toHaveClass(/open/);
    await expect(drawer.locator('header')).toHaveText('Site theme');
    await expect(drawer.locator('webui-theme-selector[panel]').getByRole('button')).toHaveCount(3);
    await button.dispatchEvent('click');
    await expect(drawer).not.toHaveClass(/open/);
});

test('switches an open drawer over from other content instead of closing it', async ({ page }) => {
    const root = await mount(page, `<webui-drawer class="shared open" data-stopclick><p>Alerts</p></webui-drawer><webui-theme-selector data-toggleclass=".shared|open">${themes}</webui-theme-selector>`);
    await root.locator('webui-theme-selector:not([panel])').dispatchEvent('click');
    const drawer = root.locator('webui-drawer.shared');
    await expect(drawer.locator('webui-theme-selector[panel]')).toHaveCount(1);
    await expect(drawer).toHaveClass(/open/);
});

test('works as a button from the keyboard', async ({ page }) => {
    const root = await mount(page, `<webui-dialogs></webui-dialogs><webui-theme-selector>${themes}</webui-theme-selector>`);
    await root.locator('webui-theme-selector').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('webui-theme-selector[panel]').getByRole('button')).toHaveCount(3);
});

test('a saved theme is applied by the loader before the page draws', async ({ page }) => {
    await page.evaluate(() => webui.setData('session-theme', 'stone'));
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 50)));
    await page.reload();
    await page.waitForFunction(() => typeof webui === 'object');
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('stone');
});

test('a saved theme the site no longer offers falls back to the default', async ({ page }) => {
    await page.evaluate(() => webui.setData('session-theme', 'retired'));
    await mount(page, `<webui-theme-selector>${themes}</webui-theme-selector>`);
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /./);
    expect(await page.evaluate(() => webui.getData('session-theme'))).toBe('');
});

test('updates the browser theme-color to the theme background', async ({ page }) => {
    await page.evaluate(() => {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = '#000000';
        document.head.appendChild(meta);
    });
    const root = await mount(page, `${styles}<webui-dialogs></webui-dialogs><webui-theme-selector>${themes}</webui-theme-selector>`);
    await root.locator('webui-theme-selector').click();
    await page.locator('webui-theme-selector[panel]').getByRole('button', { name: 'Stone' }).click();
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', 'rgb(34, 34, 34)');
});
