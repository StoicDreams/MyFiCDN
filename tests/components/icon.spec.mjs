import { test, expect, mount } from '../support/webui.mjs';

const path = (el, n) => el.locator(`path.i${n}`);

test('loads and draws the named icon', async ({ page }) => {
    const root = await mount(page, '<webui-icon icon="xmark"></webui-icon>');
    const el = root.locator('webui-icon');
    await expect(path(el, 1)).toHaveAttribute('d', /^M/);
    expect(await el.evaluate(c => c._definition)).toContain('WEBUI-ICON-');
});
test('shares one request between identical icons', async ({ page }) => {
    let requests = 0;
    page.on('request', request => { if (request.url().endsWith('/icons/bell.webui')) requests++; });
    const root = await mount(page, '<webui-icon icon="bell"></webui-icon>'.repeat(5));
    await expect(path(root.locator('webui-icon').nth(4), 1)).toHaveAttribute('d', /^M/);
    expect(requests).toBe(1);
});
test('an unknown icon shows the not found shape and warns once', async ({ page }) => {
    const warning = page.waitForEvent('console', m => m.text().includes('missing icon'));
    const root = await mount(page, '<webui-icon icon="no-such-icon"></webui-icon>');
    await warning;
    expect(await root.locator('webui-icon').evaluate(async c => { await webui.wait(() => c._definition); return c._definition; })).toContain('WEBUI-ICON-NOT-FOUND');
});
test('the latest icon wins when icons load out of order', async ({ page }) => {
    await page.route('**/icons/bell.webui', async route => {
        await new Promise(r => setTimeout(r, 300));
        await route.fallback();
    });
    const root = await mount(page, '<webui-icon icon="bell"></webui-icon>');
    const el = root.locator('webui-icon');
    await el.evaluate(c => c.setAttribute('icon', 'xmark'));
    await expect.poll(() => el.evaluate(c => c._definition || '')).toContain('XMARK');
    await page.waitForTimeout(400);
    expect(await el.evaluate(c => c._definition)).toContain('XMARK');
});
test('pipe delimited flags set and remove attributes', async ({ page }) => {
    const root = await mount(page, '<webui-icon icon="xmark|fill|shade:tri|shape:circle|-backing" backing></webui-icon>');
    const el = root.locator('webui-icon');
    await expect(el).toHaveAttribute('fill', 'true');
    await expect(el).toHaveAttribute('shade', 'tri');
    await expect(el).toHaveAttribute('shape', 'circle');
    await expect(el).not.toHaveAttribute('backing');
});
for (const shape of ['octo', 'octogon', 'tri', 'triangle', 'badge', 'circle', 'cloud', 'shield', 'other']) {
    test(`shape ${shape} draws a backing`, async ({ page }) => {
        const root = await mount(page, `<webui-icon shape="${shape}"></webui-icon>`);
        await expect(root.locator('webui-icon path.backing')).toHaveAttribute('d', /^M/);
    });
}
test('rotate turns each path and can be cleared', async ({ page }) => {
    const root = await mount(page, '<webui-icon icon="xmark" rotate="90"></webui-icon>');
    const el = root.locator('webui-icon');
    expect(await path(el, 1).evaluate(p => p.style.transform)).toBe('rotate(90deg)');
    await el.evaluate(c => c.setAttribute('rotate', '0'));
    expect(await path(el, 1).evaluate(p => p.style.transform)).toBe('');
});
test('stroke sets a width and can be cleared', async ({ page }) => {
    const root = await mount(page, '<webui-icon stroke="thin"></webui-icon>');
    const el = root.locator('webui-icon');
    const stroke = () => el.evaluate(c => c._svg.style.getPropertyValue('--ico-stroke-width'));
    expect(await stroke()).toBe('5');
    await el.evaluate(c => c.setAttribute('stroke', 'thick'));
    expect(await stroke()).toBe('15');
    await el.evaluate(c => c.setAttribute('stroke', '7'));
    expect(await stroke()).toBe('7');
    await el.evaluate(c => c.removeAttribute('stroke'));
    expect(await stroke()).toBe('');
});
test('shadow only sets the shadow, and width and height set size', async ({ page }) => {
    const root = await mount(page, '<webui-icon shadow="1px 1px 2px red" width="20" height="30"></webui-icon>');
    expect(await root.locator('webui-icon').evaluate(c => [c._svg.style.filter, c.style.width, c.style.height])).toEqual(['drop-shadow(red 1px 1px 2px)', '20px', '30px']);
});
test('count displays', async ({ page }) => {
    const root = await mount(page, '<webui-icon count="1200"></webui-icon>');
    await expect(root.locator('webui-icon slot[name="count"]')).toHaveText('1,200');
});
test('theme swaps the color pair, and clearing removes it', async ({ page }) => {
    const root = await mount(page, '<webui-icon theme="info"></webui-icon>');
    const el = root.locator('webui-icon');
    const color = () => el.evaluate(c => c.style.getPropertyValue('--theme-color'));
    expect(await color()).toBe('var(--color-info-offset)');
    await el.evaluate(c => c.setTheme(''));
    expect(await color()).toBe('');
});
test('setIconDefinition applies shades and clears unused paths', async ({ page }) => {
    const root = await mount(page, '<webui-icon></webui-icon>');
    const el = root.locator('webui-icon');
    await el.evaluate(c => c.setIconDefinition('WEBUI-ICON-T\nduo|M1 1z\ntri|M2 2z\n5|M3 3z\nM4 4z'));
    await expect(path(el, 1)).toHaveClass(/duo/);
    await expect(path(el, 1)).toHaveAttribute('d', 'M1 1z');
    await expect(path(el, 2)).toHaveClass(/tri/);
    expect(await path(el, 3).evaluate(p => p.style.strokeWidth)).toBe('5');
    await expect(path(el, 4)).toHaveAttribute('d', 'M4 4z');
    await expect(path(el, 5)).toHaveAttribute('d', /^M0 0Q0 0/);
    await el.evaluate(c => c.clearPaths());
    await expect(path(el, 1)).toHaveAttribute('d', /^M0 0Q0 0/);
});
test('normal icons do not load the emoji component or data', async ({ page }) => {
    let requests = 0;
    page.on('request', request => { if (/emojis\.json|webui\/emoji\./.test(request.url())) requests++; });
    const root = await mount(page, '<webui-icon icon="xmark"></webui-icon>');
    await expect(path(root.locator('webui-icon'), 1)).toHaveAttribute('d', /^M/);
    await expect(root.locator('webui-icon webui-emoji')).toHaveCount(0);
    expect(requests).toBe(0);
});
test('emoji icons display, keep their rotation, and can switch back', async ({ page }) => {
    const root = await mount(page, '<webui-icon rotate="45" icon="emoji-grinning"></webui-icon>');
    const el = root.locator('webui-icon');
    const emoji = el.locator('webui-emoji');
    await expect(emoji).toHaveAttribute('emoji', 'grinning');
    await expect(emoji).not.toHaveText('');
    expect(await emoji.evaluate(e => e.style.transform)).toBe('rotate(45deg)');
    await expect(el.locator('svg.main')).toHaveClass(/emoji/);
    await el.evaluate(c => c.setAttribute('icon', 'xmark'));
    await expect(el.locator('svg.main')).not.toHaveClass(/emoji/);
    await expect(emoji).toHaveText('');
});
