import { test, expect, mount } from '../support/webui.mjs';

test('webui.define watchVisibility tracks visibility, including after a move', async ({ page }) => {
    await page.evaluate(() => webui.define('app-vis', { watchVisibility: true }));
    const root = await mount(page, '<app-vis style="display:block;height:20px;position:fixed;top:0;left:0;width:20px">v</app-vis>');
    const el = root.locator('app-vis');
    await expect(el).toHaveAttribute('visible', '1');
    await el.evaluate(node => { node.style.top = '-500px'; });
    await expect(el).not.toHaveAttribute('visible');
    await el.evaluate(node => { const p = node.parentNode; node.remove(); node.style.top = '0'; p.appendChild(node); });
    await expect(el).toHaveAttribute('visible', '1');
});
for (const tag of ['webui-input-text', 'webui-input-message', 'webui-input-range']) {
}
