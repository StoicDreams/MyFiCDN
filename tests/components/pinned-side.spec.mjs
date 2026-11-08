import { test, expect, mount } from '../support/webui.mjs';

const layout = `
<webui-pinned-side>
    <div id="first" style="height:50px">First</div>
    <div id="side" slot="side" style="height:120px">Side</div>
    <div id="second" style="height:50px">Second</div>
    <div id="third" style="height:2000px">Third</div>
</webui-pinned-side>`;
const box = (root, id) => root.locator(`#${id}`).evaluate(el => {
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, right: r.right };
});

test('stacks with the side after the first item when narrow', async ({ page }) => {
    const root = await mount(page, `<div style="width:500px">${layout}</div>`);
    await expect(root.locator('webui-pinned-side')).not.toHaveAttribute('split', '');
    const [first, side, second] = await Promise.all(['first', 'side', 'second'].map(id => box(root, id)));
    expect(first.top).toBeLessThan(side.top);
    expect(side.top).toBeLessThan(second.top);
});
test('side-first and side-last move the side when stacked', async ({ page }) => {
    let root = await mount(page, `<div style="width:500px">${layout.replace('<webui-pinned-side>', '<webui-pinned-side side-first>')}</div>`);
    expect((await box(root, 'side')).top).toBeLessThan((await box(root, 'first')).top);
    root = await mount(page, `<div style="width:500px">${layout.replace('<webui-pinned-side>', '<webui-pinned-side side-last>')}</div>`);
    expect((await box(root, 'side')).top).toBeGreaterThan((await box(root, 'third')).top);
});
test('splits into two columns when wide, with the side on the right', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 800 });
    const root = await mount(page, `<div style="width:1200px">${layout}</div>`);
    await expect(root.locator('webui-pinned-side')).toHaveAttribute('split', '');
    const [first, side, second] = await Promise.all(['first', 'side', 'second'].map(id => box(root, id)));
    expect(side.left).toBeGreaterThanOrEqual(first.right);
    expect(first.top).toBeLessThan(second.top);
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
    const before = await box(root, 'side');
    await root.locator('#scroller').evaluate(s => { s.scrollTop = 800; });
    await expect.poll(async () => Math.round((await box(root, 'side')).top)).toBe(Math.round(before.top));
    expect((await box(root, 'second')).top).toBeLessThan(before.top);
});
test('side-width and gap set their values', async ({ page }) => {
    const root = await mount(page, '<webui-pinned-side side-width="400" gap="12"></webui-pinned-side>');
    const el = root.locator('webui-pinned-side');
    expect(await el.evaluate(c => [c.style.getPropertyValue('--side-width'), c.style.getPropertyValue('--gap')])).toEqual(['400px', '12px']);
});
