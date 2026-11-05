import { test, expect, mount } from '../support/webui.mjs';

test('images use the image element', async ({ page }) => {
    const root = await mount(page, '<webui-file-preview></webui-file-preview>');
    const el = root.locator('webui-file-preview');
    await el.evaluate(c => c.setFile([{ type: 'image/png', content: 'data:image/png;base64,AA' }]));
    await expect(el.locator('img')).toHaveAttribute('src', /^data:image/);
    await expect(el.locator('iframe')).not.toHaveAttribute('src');
});
test('data urls load in the frame', async ({ page }) => {
    const root = await mount(page, '<webui-file-preview></webui-file-preview>');
    const el = root.locator('webui-file-preview');
    await el.evaluate(c => c.setFile([{ type: 'application/pdf', content: 'data:application/pdf;base64,AA' }]));
    await expect(el.locator('iframe')).toHaveAttribute('src', /^data:application/);
    await expect(el.locator('iframe')).not.toHaveAttribute('sandbox');
});
test('text files are sandboxed so they cannot run scripts on this site', async ({ page }) => {
    const root = await mount(page, '<webui-file-preview></webui-file-preview>');
    const el = root.locator('webui-file-preview');
    await el.evaluate(c => c.setFile([{ type: 'text/html', content: '<script>parent.__hacked = 1</script>' }]));
    await expect(el.locator('iframe')).toHaveAttribute('sandbox', '');
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => window.__hacked)).toBeUndefined();
});
test('clear removes the preview, and empty input clears', async ({ page }) => {
    const root = await mount(page, '<webui-file-preview></webui-file-preview>');
    const el = root.locator('webui-file-preview');
    await el.evaluate(c => c.setFile([{ type: 'text/plain', content: 'x' }]));
    await el.evaluate(c => c.setFile([]));
    await expect(el.locator('iframe')).not.toHaveAttribute('srcdoc');
    await expect(el.locator('iframe')).not.toHaveAttribute('sandbox');
});
test('height applies to the host and image', async ({ page }) => {
    const root = await mount(page, '<webui-file-preview height="50"></webui-file-preview>');
    expect(await root.locator('webui-file-preview').evaluate(c => [c.style.height, c._img.style.height])).toEqual(['50px', '50px']);
});
