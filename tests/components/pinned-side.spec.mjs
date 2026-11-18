import { test, expect, mount } from '../support/webui.mjs';

const layout = `
<webui-pinned-side>
    <div id="first" style="height:50px">First</div>
    <div id="side" slot="side" style="height:120px">Side</div>
    <div id="second" style="height:50px">Second</div>
    <div id="third" style="height:2000px">Third</div>
</webui-pinned-side>`;
// Tested by its state (split, split-width, side-width, gap) and by what stays in view. Where each column sits is
// checked by eye.

test('stays one column when narrow, with the side showing', async ({ page }) => {
    const root = await mount(page, `<div style="width:500px">${layout}</div>`);
    await expect(root.locator('webui-pinned-side')).not.toHaveAttribute('split', '');
    await expect(root.locator('#side')).toBeVisible();
});
test('splits into two columns when wide', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 800 });
    const root = await mount(page, `<div style="width:1200px">${layout}</div>`);
    await expect(root.locator('webui-pinned-side')).toHaveAttribute('split', '');
    await expect(root.locator('#side')).toBeVisible();
});
test('split-width sets the width where it splits, and it unsplits when narrowed', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 800 });
    const root = await mount(page, `<div id="wrap" style="width:700px">${layout.replace('<webui-pinned-side>', '<webui-pinned-side split-width="600">')}</div>`);
    const el = root.locator('webui-pinned-side');
    await expect(el).toHaveAttribute('split', '');
    await root.locator('#wrap').evaluate(w => { w.style.width = '500px'; });
    await expect(el).not.toHaveAttribute('split', '');
});
test('the side stays in view while the main column scrolls', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 800 });
    const root = await mount(page, `<div id="scroller" style="width:1200px;height:500px;overflow:auto">${layout}</div>`);
    await expect(root.locator('webui-pinned-side')).toHaveAttribute('split', '');
    await root.locator('#scroller').evaluate(s => { s.scrollTop = 800; });
    // The main column scrolled its first items away, and the side is still there.
    await expect(root.locator('#first')).not.toBeInViewport();
    await expect(root.locator('#side')).toBeInViewport();
});
test('side-width and gap set their values', async ({ page }) => {
    const root = await mount(page, '<webui-pinned-side side-width="400" gap="12"></webui-pinned-side>');
    const el = root.locator('webui-pinned-side');
    await expect.poll(() => el.evaluate(c => [c.style.getPropertyValue('--side-width'), c.style.getPropertyValue('--gap')])).toEqual(['400px', '12px']);
});
