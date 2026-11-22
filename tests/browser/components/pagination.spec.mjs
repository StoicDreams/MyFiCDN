import { test, expect, mount } from '../support/webui.mjs';

const pager = async (page, attributes = '') => {
    const root = await mount(page, `<webui-pagination ${attributes}></webui-pagination>`);
    return root.locator('webui-pagination');
};
const rows = n => Array.from({ length: n }, (_, i) => ({ i }));

test('the page size can be read: drawn without the native look, with text that contrasts with its box', async ({ page }) => {
    const el = await pager(page, 'per-page="20" class="theme-background"');
    await el.evaluate((c, data) => c.setData(data), rows(50));
    const select = el.locator('select');
    await expect(select).toBeVisible();
    const style = await select.evaluate(s => {
        const css = getComputedStyle(s);
        return { appearance: css.appearance, color: css.color, background: css.backgroundColor };
    });
    // A native select on WebKitGTK ignores the background, and showed light text on a light box.
    expect(style.appearance).toBe('none');
    // Colors read as rgb(), or as color(srgb) with 0 to 1 parts for a color-mix.
    const channels = text => {
        const parts = text.match(/[\d.]+/g).map(Number);
        return text.startsWith('color(') ? parts.slice(0, 3).map(n => n * 255) : parts.slice(0, 3);
    };
    const luminance = text => {
        const [r, g, b] = channels(text).map(c => {
            c /= 255;
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const [light, dark] = [luminance(style.color), luminance(style.background)].sort((a, b) => b - a);
    expect((light + 0.05) / (dark + 0.05)).toBeGreaterThanOrEqual(4.5);
});
test('hide-prev-next-buttons leaves only the page numbers, which are named as pages', async ({ page }) => {
    const root = await mount(page, '<webui-pagination per-page="1" hide-prev-next-buttons></webui-pagination>');
    const el = root.locator('webui-pagination');
    await el.evaluate(p => p.setData([1, 2, 3]));
    await expect(el.getByRole('button', { name: 'Page 2' })).toBeVisible();
    await expect(el.getByRole('button', { name: 'Next page' })).toBeHidden();
    await expect(el.getByRole('button', { name: 'Previous page' })).toBeHidden();
    await el.evaluate(p => p.removeAttribute('hide-prev-next-buttons'));
    await expect(el.getByRole('button', { name: 'Next page' })).toBeVisible();
});
