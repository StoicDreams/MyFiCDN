import { test, expect, mount } from '../support/webui.mjs';

const panes = (attrs = '', width = 1000) => `
<div id="box" style="width:${width}px;height:500px;overflow:auto;padding:0;">
    <webui-split-panes ${attrs}>
        <div slot="start" id="start"><div style="width:1500px;height:900px;">Issues</div></div>
        <div slot="end" id="end"><button id="inside">Inside</button></div>
    </webui-split-panes>
</div>`;
const widths = page => page.evaluate(() => {
    const split = document.querySelector('webui-split-panes');
    const part = name => split.shadowRoot.querySelector(name).getBoundingClientRect().width;
    return { start: part('.start'), end: part('.end'), bar: part('.bar') };
});

test('the panes start even, and the start pane scrolls content wider than it', async ({ page }) => {
    const root = await mount(page, panes());
    const split = root.locator('webui-split-panes');
    await expect(split.locator('.bar')).toHaveAttribute('aria-valuenow', '50');
    const { start, end, bar } = await widths(page);
    expect(bar).toBe(8);
    expect(Math.abs(start - end)).toBeLessThanOrEqual(1);
    const scrolls = await page.evaluate(() => {
        const pane = document.querySelector('webui-split-panes').shadowRoot.querySelector('.start');
        return pane.scrollWidth > pane.clientWidth && getComputedStyle(pane).overflowX === 'auto';
    });
    expect(scrolls).toBe(true);
});

test('dragging the bar resizes the panes, keeps each at its minimum, and sends the ratio once', async ({ page }) => {
    const root = await mount(page, panes());
    const split = root.locator('webui-split-panes');
    await page.evaluate(() => {
        window.__changes = [];
        document.querySelector('webui-split-panes').addEventListener('change', ev => window.__changes.push(ev.detail.ratio));
    });
    const bar = split.locator('.bar');
    const box = await bar.boundingBox();
    await page.mouse.move(box.x + 4, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x - 60, box.y + 100, { steps: 4 });
    await page.mouse.move(box.x - 400, box.y + 100, { steps: 4 });
    await page.mouse.up();
    const { start, end } = await widths(page);
    // 1000px leaves 992px for the panes, so the start pane stops at its 400px minimum.
    expect(Math.round(start)).toBe(400);
    expect(Math.round(end)).toBe(592);
    expect(await page.evaluate(() => window.__changes)).toEqual([0.403]);
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

test('a saved ratio is used, and min changes how narrow a pane can be', async ({ page }) => {
    await mount(page, panes('ratio="0.25" min="200"'));
    const { start } = await widths(page);
    expect(Math.round(start)).toBe(Math.round(992 * 0.25));
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
    // The end pane covers all of it, with the button down its left side.
    const end = await split.locator('.end').boundingBox();
    expect(Math.round(end.width)).toBe(700);
    const strip = await toStart.boundingBox();
    expect(Math.round(strip.height)).toBe(Math.round(end.height));
    expect(Math.round(strip.x)).toBe(Math.round(end.x));
    await toStart.click();
    await expect(split).toHaveAttribute('show', 'start');
    await expect(split.locator('.end')).toBeHidden();
    // Now the button to come back runs down the right side of the start pane.
    await expect(toEnd).toBeVisible();
    await expect(toEnd).toBeFocused();
    const right = await toEnd.boundingBox();
    expect(Math.round(right.x + right.width)).toBe(Math.round(end.x + end.width));
    await toEnd.click();
    await expect(split).toHaveAttribute('show', 'end');
    await expect(toStart).toBeFocused();
    // Wide enough again, both show side by side.
    await page.evaluate(() => { document.getElementById('box').style.width = '1000px'; });
    await expect(split).not.toHaveAttribute('narrow', '');
    await expect(split.locator('.bar')).toBeVisible();
});

test('fill makes the panes as tall as the visible part of what scrolls them', async ({ page }) => {
    const root = await mount(page, `
<div id="box" style="width:1000px;height:500px;overflow:auto;padding:10px;box-sizing:border-box;">
    <div style="height:60px">Above</div>
    <webui-split-panes fill>
        <div slot="start"><div style="height:2000px">Tall</div></div>
        <div slot="end">Side</div>
    </webui-split-panes>
</div>`);
    const split = root.locator('webui-split-panes');
    // 500px less 20px of padding and the 60px above it.
    await expect.poll(async () => Math.round((await split.boundingBox()).height)).toBe(420);
    await page.evaluate(() => { document.getElementById('box').style.height = '600px'; });
    await expect.poll(async () => Math.round((await split.boundingBox()).height)).toBe(520);
});
