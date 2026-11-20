import { test, expect, mount } from '../support/webui.mjs';

test('wrap-at wraps below the given width, including after a move', async ({ page }) => {
    const root = await mount(page, '<webui-flex wrap-at="300" style="width:500px"></webui-flex>');
    const el = root.locator('webui-flex');
    await expect(el).not.toHaveAttribute('wrap');
    await el.evaluate(c => { c.style.width = '200px'; });
    await expect(el).toHaveAttribute('wrap', '');
    await el.evaluate(c => { const p = c.parentNode; c.remove(); p.appendChild(c); c.style.width = '500px'; });
    await expect(el).not.toHaveAttribute('wrap');
});

test('wrap-at changes its layout without a ResizeObserver loop error', async ({ page }) => {
    // Wrapping changes the flex's own height, which an observer watching it reports in the same frame unless the
    // attribute is set in the next frame.
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const root = await mount(page, `<div id="box" style="width:500px"><webui-flex wrap-at="600">
        <div style="width:400px;height:40px"></div><div style="width:400px;height:40px"></div>
    </webui-flex></div>`);
    const el = root.locator('webui-flex');
    await expect(el).toHaveAttribute('wrap', '');
    await root.locator('#box').evaluate(box => { box.style.width = '900px'; });
    await expect(el).not.toHaveAttribute('wrap');
    await root.locator('#box').evaluate(box => { box.style.width = '450px'; });
    await expect(el).toHaveAttribute('wrap', '');
    // A loop error is reported in the frame after the layout change, so two frames later it would have arrived.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    expect(errors.filter(e => e.includes('ResizeObserver'))).toEqual([]);
});
