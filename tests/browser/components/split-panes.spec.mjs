import { test, expect, mount } from '../support/webui.mjs';

const panes = (attrs = '', width = 1000) => `
<div id="box" style="width:${width}px;height:500px;overflow:auto;padding:0;">
    <webui-split-panes ${attrs}>
        <div slot="start" id="start"><div style="width:1500px;height:900px;">Issues</div></div>
        <div slot="end" id="end"><button id="inside">Inside</button></div>
    </webui-split-panes>
</div>`;
// The split is tested by the state it keeps (ratio, aria-valuenow, narrow, show) and by what can be seen and scrolled.
// How wide each pane looks is checked by eye.
/** Scrolls an element as far as it goes, and says whether it moved. */
const scrolls = (page, find, axis) => page.evaluate(({ find, axis }) => {
    const el = (0, eval)(find);
    if (axis === 'x') { el.scrollLeft = 100000; return el.scrollLeft > 0; }
    el.scrollTop = 100000;
    return el.scrollTop > 0;
}, { find, axis });
const startPane = "document.querySelector('webui-split-panes').shadowRoot.querySelector('.start')";

test('the panes start even, and the start pane scrolls content wider than it', async ({ page }) => {
    const root = await mount(page, panes());
    const split = root.locator('webui-split-panes');
    await expect(split.locator('.bar')).toHaveAttribute('aria-valuenow', '50');
    // Content wider than the pane scrolls inside it, sideways.
    await expect.poll(() => scrolls(page, startPane, 'x')).toBe(true);
});

test('dragging the bar resizes the panes, keeps each at its minimum, and sends the ratio once', async ({ page }) => {
    const root = await mount(page, panes());
    const split = root.locator('webui-split-panes');
    await page.evaluate(() => {
        window.__changes = [];
        document.querySelector('webui-split-panes').addEventListener('change', ev => window.__changes.push(ev.detail.ratio));
    });
    const bar = split.locator('.bar');
    // The bar's place is only used to drag it, as a person would.
    await bar.hover({ position: { x: 4, y: 100 } });
    const box = await bar.boundingBox();
    await page.mouse.move(box.x + 4, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x - 60, box.y + 100, { steps: 4 });
    await page.mouse.move(box.x - 400, box.y + 100, { steps: 4 });
    await page.mouse.up();
    // Dragged past the start pane's 400px minimum, the split stops there (400 of the 992px the panes share), and
    // reports that once.
    await expect.poll(() => page.evaluate(() => window.__changes)).toEqual([0.403]);
    await expect(split).toHaveAttribute('ratio', '0.403');
});

test('the keyboard moves the bar, and double click or Enter evens the panes', async ({ page }) => {
    const root = await mount(page, panes('ratio="0.5" min="100"'));
    const split = root.locator('webui-split-panes');
    const bar = split.locator('.bar');
    await bar.focus();
    await page.keyboard.press('ArrowRight');
    await expect(split).toHaveAttribute('ratio', '0.55');
    await page.keyboard.press('Home');
    await expect(bar).toHaveAttribute('aria-valuenow', '10');
    await page.keyboard.press('Enter');
    await expect(split).toHaveAttribute('ratio', '0.5');
    await page.keyboard.press('End');
    await bar.dblclick();
    await expect(split).toHaveAttribute('ratio', '0.5');
});

test('a saved ratio is used', async ({ page }) => {
    const root = await mount(page, panes('ratio="0.25" min="200"'));
    await expect(root.locator('webui-split-panes .bar')).toHaveAttribute('aria-valuenow', '25');
});

test('too narrow for both, the end pane covers the start pane, with a full height button to each', async ({ page }) => {
    const root = await mount(page, panes('start-label="My Issues" end-label="Issue"', 700));
    const split = root.locator('webui-split-panes');
    await expect(split).toHaveAttribute('narrow', '');
    await expect(split).toHaveAttribute('show', 'end');
    const toStart = split.getByRole('button', { name: 'My Issues' });
    const toEnd = split.getByRole('button', { name: 'Issue', exact: true });
    await expect(split.locator('.bar')).toBeHidden();
    await expect(toEnd).toBeHidden();
    // The end pane shows, with a button back to the start pane. Where the button sits is checked by eye.
    await expect(split.locator('.end')).toBeVisible();
    await expect(toStart).toBeVisible();
    await toStart.click();
    await expect(split).toHaveAttribute('show', 'start');
    await expect(split.locator('.end')).toBeHidden();
    // Now the button to come back runs down the right side of the start pane.
    await expect(toEnd).toBeVisible();
    await expect(toEnd).toBeFocused();
    await toEnd.click();
    await expect(split).toHaveAttribute('show', 'end');
    await expect(toStart).toBeFocused();
    // Wide enough again, both show side by side.
    await page.evaluate(() => { document.getElementById('box').style.width = '1000px'; });
    await expect(split).not.toHaveAttribute('narrow', '');
    await expect(split.locator('.bar')).toBeVisible();
});

test('single shows one pane at a time at any width, with a button to each', async ({ page }) => {
    const root = await mount(page, panes('single start-label="My Issues" end-label="Issue"', 1400));
    const split = root.locator('webui-split-panes');
    await expect(split).toHaveAttribute('narrow', '');
    await expect(split.locator('.bar')).toBeHidden();
    const toStart = split.getByRole('button', { name: 'My Issues' });
    const toEnd = split.getByRole('button', { name: 'Issue', exact: true });
    await toStart.click();
    await expect(split).toHaveAttribute('show', 'start');
    await expect(split.locator('.end')).toBeHidden();
    await toEnd.click();
    await expect(split).toHaveAttribute('show', 'end');
    // Without single, the panes are side by side again, since there is room.
    await split.evaluate(el => el.removeAttribute('single'));
    await expect(split).not.toHaveAttribute('narrow', '');
    await expect(split.locator('.bar')).toBeVisible();
    await split.evaluate(el => el.setAttribute('single', ''));
    await expect(split).toHaveAttribute('narrow', '');
});
test('fill keeps the panes inside the visible part of what scrolls them, so only the panes scroll', async ({ page }) => {
    const root = await mount(page, `
<div id="box" style="width:1000px;height:500px;overflow:auto;padding:10px;box-sizing:border-box;">
    <div style="height:60px">Above</div>
    <webui-split-panes fill>
        <div slot="start"><div style="height:2000px">Tall</div></div>
        <div slot="end">Side</div>
    </webui-split-panes>
</div>`);
    const box = "document.getElementById('box')";
    // The panes fit the box, so the box has nothing to scroll, and the tall pane scrolls on its own.
    await expect.poll(() => scrolls(page, box, 'y')).toBe(false);
    await expect.poll(() => scrolls(page, startPane, 'y')).toBe(true);
    // They fit again when the box grows.
    await page.evaluate(() => { document.getElementById('box').style.height = '600px'; });
    await expect.poll(() => scrolls(page, box, 'y')).toBe(false);
});
