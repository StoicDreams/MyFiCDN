import { test, expect, mount } from '../support/webui.mjs';

test('shows the value, label, and description', async ({ page }) => {
    const root = await mount(page, '<webui-stat value="100 ms" label="Per request"><p id="text">Every request, every report.</p></webui-stat>');
    const stat = root.locator('webui-stat');
    await expect(stat.locator('.value')).toHaveText('100 ms');
    await expect(stat.locator('.label')).toHaveText('Per request');
    await expect(stat.locator('.label')).toBeVisible();
    await expect(root.locator('#text')).toBeVisible();
    const size = await stat.locator('.value').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    expect(size).toBeGreaterThanOrEqual(32);
});

test('without a label, the label is hidden', async ({ page }) => {
    const root = await mount(page, '<webui-stat value="2x"></webui-stat>');
    await expect(root.locator('webui-stat .label')).toBeHidden();
});

test('the value is filled with --fill-accent, which can be a gradient', async ({ page }) => {
    const root = await mount(page, '<webui-stat value="24" style="--fill-accent:linear-gradient(90deg, red, blue)"></webui-stat>');
    const fill = await root.locator('webui-stat .value').evaluate(el => getComputedStyle(el).backgroundImage);
    expect(fill).toContain('linear-gradient');
});

test('stats sit side by side in a row, and wrap at width', async ({ page }) => {
    const root = await mount(page, '<webui-flex wrap style="width:1000px"><webui-stat id="a" value="1"></webui-stat><webui-stat id="b" value="2"></webui-stat><webui-stat id="c" value="3"></webui-stat></webui-flex>');
    const [a, b] = await Promise.all(['#a', '#b'].map(s => root.locator(s).evaluate(el => el.getBoundingClientRect().toJSON())));
    expect(b.left).toBeGreaterThanOrEqual(a.right - 1);
    expect(Math.abs(a.top - b.top)).toBeLessThan(2);
    const narrow = await mount(page, '<webui-flex wrap style="width:300px"><webui-stat id="a" value="1"></webui-stat><webui-stat id="b" value="2" width="200"></webui-stat></webui-flex>');
    const [na, nb] = await Promise.all(['#a', '#b'].map(s => narrow.locator(s).evaluate(el => el.getBoundingClientRect().toJSON())));
    expect(nb.top).toBeGreaterThanOrEqual(na.bottom - 1);
});
