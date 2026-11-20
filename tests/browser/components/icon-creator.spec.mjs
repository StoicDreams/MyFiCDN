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

test('on a wide, short screen the editor fits in the window', async ({ page }) => {
    const el = await creator(page);
    await page.setViewportSize({ width: 2000, height: 880 });
    // The editor is in a column about 1200 wide, so without a limit it was 1200 tall and ran off the screen.
    await el.evaluate(c => c._svgContainer.scrollIntoView({ block: 'start' }));
    await expect.poll(() => el.evaluate(c => new Promise(resolve => {
        new IntersectionObserver(([entry], observer) => { observer.disconnect(); resolve(entry.intersectionRatio > 0.95); }).observe(c._svgContainer);
    }))).toBe(true);
});
