import { test, expect, mount } from '../support/webui.mjs';
import { readFileSync } from 'node:fs';

// The first icon listed, and the bell's first path, read from the files, so adding or redrawing icons does not break these tests.
const allIcons = JSON.parse(readFileSync(new URL('../../../cdn/icons/all.json', import.meta.url), 'utf8'));
const firstIcon = `WEBUI-ICON-${allIcons[0].name.toUpperCase()}`;
// The creator lists and draws every icon, which is hundreds of files to load. These tests only use the first icon
// and the bell, so the list is cut to a few, which keeps them quick on a busy machine.
const fewIcons = [...allIcons.slice(0, 3), ...allIcons.filter(icon => icon.name.startsWith('bell'))];
const bellPath = readFileSync(new URL('../../../cdn/icons/bell.webui', import.meta.url), 'utf8').replace(/\r/g, '').split('\n')[1];

const creator = async page => {
    await page.setViewportSize({ width: 1600, height: 1200 });
    await page.route('**/icons/all.json', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(fewIcons) }));
    const root = await mount(page, '<webui-icon-creator></webui-icon-creator>');
    const el = root.locator('webui-icon-creator');
    await expect(el.locator('a').first()).toBeVisible();
    return el;
};
const iconFromList = (el, name) => el.locator('a').filter({ has: el.page().locator(`label:text-is("${name}")`) });

test('a resize while it is still loading is harmless', async ({ page }) => {
    // A component it uses is held back, so it is still loading when the resize arrives.
    let release;
    const held = new Promise(resolve => { release = resolve; });
    await page.route('**/webui/dropdown.*', async route => {
        await held;
        await route.fallback();
    });
    await page.route('**/icons/all.json', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(fewIcons) }));
    const root = await mount(page, '<webui-icon-creator></webui-icon-creator>');
    await root.locator('webui-icon-creator').evaluate(c => c.onResize());
    release();
    await expect(root.locator('webui-icon-creator webui-dropdown').first()).toBeVisible();
});
test('opens with the first icon drawn in the editor', async ({ page }) => {
    const el = await creator(page);
    await expect.poll(() => el.evaluate(c => c._inputFull.value)).toContain(firstIcon);
    await expect.poll(() => el.evaluate(c => c._previewPath.getAttribute('d'))).toMatch(/^M/);
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
