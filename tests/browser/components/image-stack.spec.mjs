import { test, expect, mount } from '../support/webui.mjs';

// Solid-color pictures drawn in the page, so the tests need no image files.
const picture = (w, h, color) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${color}"/></svg>`)}`;
const stack = attrs => `<div style="width:600px"><webui-image-stack ${attrs}>
<img src="${picture(300, 200, 'red')}" alt="Wide">
<img src="${picture(100, 250, 'blue')}" alt="Tall">
</webui-image-stack></div>`;

test('images sit on one another, each offset from the one above, inside the stack', async ({ page }) => {
    const root = await mount(page, stack('offset-x="40" offset-y="30" transition="0"'));
    const imgs = root.locator('webui-image-stack img');
    await expect.poll(() => imgs.nth(1).evaluate(img => img.complete && img.naturalWidth)).toBe(100);
    const a = await imgs.nth(0).boundingBox();
    const b = await imgs.nth(1).boundingBox();
    expect(Math.round(b.x - a.x)).toBe(40);
    expect(Math.round(b.y - a.y)).toBe(30);
    // The stack is tall enough for the deepest image and its offset.
    const box = await root.locator('webui-image-stack').boundingBox();
    expect(Math.round(box.height)).toBe(250 + 30);
    expect(b.y + b.height).toBeLessThanOrEqual(box.y + box.height + 0.5);
});
test('the top image takes clicks, and an image below it is brought up by a click on what shows of it', async ({ page }) => {
    const root = await mount(page, stack('offset-x="40" offset-y="30" transition="0"'));
    const imgs = root.locator('webui-image-stack img');
    await expect.poll(() => imgs.nth(1).evaluate(img => img.complete && img.naturalWidth)).toBe(100);
    const b = await imgs.nth(1).boundingBox();
    // The tall image shows below the wide one.
    await page.mouse.click(b.x + b.width / 2, b.y + b.height - 10);
    await expect(imgs.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => imgs.nth(1).boundingBox().then(r => Math.round(r.x))).toBe(Math.round(b.x - 40));
});
test('rotations ease over the transition time, 500ms by default', async ({ page }) => {
    const root = await mount(page, `${stack('rotate')}${stack('id="quick" transition="120"')}`);
    const img = root.locator('webui-image-stack').first().locator('img').first();
    await expect.poll(() => img.evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0.5s');
    await expect.poll(() => img.evaluate(el => getComputedStyle(el).transitionTimingFunction)).toBe('cubic-bezier(0.65, 0, 0.35, 1)');
    await expect.poll(() => root.locator('#quick img').first().evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0.12s');
});
test('images share one scale, so they keep their sizes relative to one another', async ({ page }) => {
    const root = await mount(page, `<div style="width:600px"><webui-image-stack offset-x="40" offset-y="30" transition="0" style="height:200px">
<img src="${picture(300, 200, 'red')}" alt="Wide">
<img src="${picture(100, 250, 'blue')}" alt="Tall">
</webui-image-stack></div>`);
    const imgs = root.locator('webui-image-stack img');
    // The room is 170px high once the 30px offset is kept free: the tall image sets the scale, 170 / 250.
    await expect.poll(() => imgs.nth(1).boundingBox().then(r => Math.round(r.height))).toBe(170);
    await expect.poll(() => imgs.nth(0).boundingBox().then(r => Math.round(r.width))).toBe(204);
    expect(Math.round((await imgs.nth(0).boundingBox()).height)).toBe(136);
});
