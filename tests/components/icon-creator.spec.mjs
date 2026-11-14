import { test, expect, mount } from '../support/webui.mjs';
import { readFileSync } from 'node:fs';

// The first icon listed, and the bell's first path, read from the files, so adding or redrawing icons does not break these tests.
const firstIcon = `WEBUI-ICON-${JSON.parse(readFileSync(new URL('../../cdn/icons/all.json', import.meta.url), 'utf8'))[0].name.toUpperCase()}`;
const bellPath = readFileSync(new URL('../../cdn/icons/bell.webui', import.meta.url), 'utf8').replace(/\r/g, '').split('\n')[1];

const creator = async page => {
    await page.setViewportSize({ width: 1600, height: 1200 });
    const root = await mount(page, '<webui-icon-creator></webui-icon-creator>');
    const el = root.locator('webui-icon-creator');
    await expect(el.locator('a').first()).toBeVisible({ timeout: 10000 });
    return el;
};
const iconFromList = (el, name) => el.locator('a').filter({ has: el.page().locator(`label:text-is("${name}")`) });

test('a resize while it is still loading is harmless', async ({ page }) => {
    await page.route('**/webui/dropdown.*', async route => {
        await new Promise(r => setTimeout(r, 500));
        await route.fallback();
    });
    const root = await mount(page, '<webui-icon-creator></webui-icon-creator>');
    await root.locator('webui-icon-creator').evaluate(c => c.onResize());
});
test('opens with the first icon drawn in the editor', async ({ page }) => {
    const el = await creator(page);
    await expect.poll(() => el.evaluate(c => c._inputFull.value)).toContain(firstIcon);
    await expect.poll(() => el.evaluate(c => c._previewPath.getAttribute('d'))).toMatch(/^M/);
});
test('the reference icon fills the editor', async ({ page }) => {
    const el = await creator(page);
    await expect.poll(() => el.evaluate(c => c._inputFull.value)).toContain(firstIcon);
    const [container, preview] = await el.evaluate(c => [c._svgContainer, c._iconPreview].map(n => n.getBoundingClientRect().height));
    expect(container).toBeGreaterThan(100);
    expect(preview).toBe(container);
});
test('on a wide, short screen the editor stays square and no taller than the window', async ({ page }) => {
    const el = await creator(page);
    await page.setViewportSize({ width: 2000, height: 880 });
    // The editor is in a column about 1200 wide, so without a limit it was 1200 tall and ran off the screen.
    await expect.poll(() => el.evaluate(c => Math.round(c._svgContainer.getBoundingClientRect().height))).toBeLessThan(880);
    const [width, height, svg] = await el.evaluate(c => [c._svgContainer.clientWidth, c._svgContainer.clientHeight, c._svgPreview.clientWidth]);
    expect(width).toBe(height);
    // Dragging works out positions from the drawing's width, so it has to shrink with the editor.
    expect(svg).toBe(width);
});
test('clicking an icon in the list loads it for editing', async ({ page }) => {
    const el = await creator(page);
    await iconFromList(el, 'bell').first().evaluate(a => a.click());
    await expect.poll(() => el.evaluate(c => c._inputFull.value)).toContain('WEBUI-ICON-BELL');
    await expect.poll(() => el.evaluate(c => c._previewPath.getAttribute('d'))).toBe(bellPath);
    await expect.poll(() => el.evaluate(c => c._iconPreview._definition)).toContain('WEBUI-ICON-BELL');
});
test('selecting another path shows that line', async ({ page }) => {
    const el = await creator(page);
    await iconFromList(el, 'bell').first().evaluate(a => a.click());
    await expect.poll(() => el.evaluate(c => c._inputPath.value)).toBe(bellPath);
    await el.evaluate(c => { c._selectPath.value = '2'; c._selectPath.triggerChange(); });
    await expect.poll(() => el.evaluate(c => `${c._modPath}`)).toBe('2');
});
test('editing the definition redraws', async ({ page }) => {
    const el = await creator(page);
    await expect.poll(() => el.evaluate(c => c._previewPath.getAttribute('d'))).toMatch(/^M/);
    await el.locator('textarea').first().fill('WEBUI-ICON-MINE\nM0 0Q5 5 10 10z');
    await expect.poll(() => el.evaluate(c => c._iconPreview._definition)).toContain('WEBUI-ICON-MINE');
});
