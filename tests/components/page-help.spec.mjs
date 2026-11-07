import { test, expect, mount } from '../support/webui.mjs';

const HELP = '<webui-page-help heading="Page Help"><p class="content">How to use this page.</p><button class="inside">Inside</button></webui-page-help>';
const ready = async (page, html = HELP) => {
    const root = await mount(page, html);
    const help = root.locator('webui-page-help');
    await help.evaluate(el => customElements.upgrade(el));
    return help;
};
const box = locator => locator.evaluate(el => {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
});
const dialog = help => help.locator('dialog');
const isOpen = help => help.evaluate(el => el.shadowRoot.querySelector('dialog').open);
// The element with focus, looking through shadow roots.
const focused = page => page.evaluate(() => {
    let active = document.activeElement;
    while (active && active.shadowRoot && active.shadowRoot.activeElement) active = active.shadowRoot.activeElement;
    return active ? `${active.tagName.toLowerCase()}.${active.className}` : null;
});
const drag = async (page, help, dx, dy) => {
    const b = await box(help.locator('button.bubble'));
    const x = b.left + b.width / 2, y = b.top + b.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx / 2, y + dy / 2, { steps: 3 });
    await page.mouse.move(x + dx, y + dy, { steps: 3 });
    await page.mouse.up();
};

test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1000, height: 700 });
});

test('a bubble shows at the bottom right, and nothing shows without content', async ({ page }) => {
    const help = await ready(page);
    const bubble = help.locator('button.bubble');
    await expect(bubble).toBeVisible();
    await expect(bubble).toHaveText('Help');
    const b = await box(bubble);
    expect(1000 - b.right).toBeLessThan(40);
    expect(700 - b.bottom).toBeLessThan(40);
    await expect(help.locator('p.content')).toBeHidden();
    const empty = await ready(page, '<webui-page-help> </webui-page-help>');
    await expect(empty.locator('button.bubble')).toBeHidden();
});
test('the bubble sits just above a footer along the bottom of the window', async ({ page }) => {
    const help = await ready(page, `<footer style="position:fixed;left:0;right:0;bottom:0;height:60px;background:#333"></footer>${HELP}`);
    await expect.poll(async () => (await box(help.locator('button.bubble'))).bottom).toBeLessThanOrEqual(640);
    expect((await box(help.locator('button.bubble'))).bottom).toBeGreaterThan(600);
});
test('label, heading, and icon can be set', async ({ page }) => {
    const help = await ready(page, '<webui-page-help label="Guide" icon="messages-question"><p>x</p></webui-page-help>');
    await expect(help.locator('button.bubble')).toHaveText('Guide');
    await expect(help.locator('button.bubble webui-icon')).toHaveAttribute('icon', 'messages-question');
    await help.locator('button.bubble').click();
    await expect(help.locator('dialog h2')).toHaveText('Guide');
    await help.evaluate(el => el.setAttribute('heading', 'All About Guides'));
    await expect(help.locator('dialog h2')).toHaveText('All About Guides');
});
test('clicking the bubble opens the content in a dialog', async ({ page }) => {
    const help = await ready(page);
    await help.locator('button.bubble').click();
    await expect(dialog(help)).toBeVisible();
    await expect(help.locator('dialog h2')).toHaveText('Page Help');
    await expect(help.locator('p.content')).toBeVisible();
    await expect(help.locator('button.bubble')).toHaveCSS('opacity', '0');
    // Content stays usable, since it is shown in place rather than copied.
    await page.evaluate(() => { window.__clicked = 0; document.querySelector('button.inside').addEventListener('click', () => window.__clicked++); });
    await help.locator('button.inside').click();
    expect(await page.evaluate(() => window.__clicked)).toBe(1);
});
test('the close button, Escape, and a click outside close it, and focus returns to the bubble', async ({ page }) => {
    const help = await ready(page);
    await help.locator('button.bubble').click();
    await help.locator('dialog button.close').click();
    await expect.poll(() => isOpen(help)).toBe(false);
    await expect.poll(() => focused(page)).toBe('button.bubble');
    await page.keyboard.press('Enter');
    await expect.poll(() => isOpen(help)).toBe(true);
    await page.keyboard.press('Escape');
    await expect.poll(() => isOpen(help)).toBe(false);
    await help.locator('button.bubble').click();
    await page.mouse.click(5, 5);
    await expect.poll(() => isOpen(help)).toBe(false);
    await help.locator('button.bubble').click();
    await help.locator('p.content').click();
    expect(await isOpen(help)).toBe(true);
});
test('it grows out of the bubble and shrinks back into it', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const help = await ready(page);
    await page.evaluate(() => {
        window.__animations = [];
        const original = HTMLElement.prototype.animate;
        HTMLElement.prototype.animate = function (frames, options) {
            if (this.tagName === 'DIALOG') window.__animations.push(frames.map(f => f.transform));
            return original.call(this, frames, options);
        };
    });
    await help.locator('button.bubble').click();
    await expect.poll(() => page.evaluate(() => window.__animations.length)).toBe(1);
    await help.locator('dialog button.close').click();
    await expect.poll(() => isOpen(help)).toBe(false);
    const [opening, closing] = await page.evaluate(() => window.__animations);
    expect(opening[0]).toMatch(/scale\(0\.\d+\)/);
    expect(opening[1]).toContain('scale(1)');
    expect(closing[1]).toMatch(/scale\(0\.\d+\)/);
});
test('dragging moves the bubble without opening it, and the position is remembered', async ({ page }) => {
    const help = await ready(page);
    // Measured on its wrapper, since the bubble grows a little while hovered.
    const before = await box(help.locator('.float'));
    await drag(page, help, -400, -300);
    const after = await box(help.locator('.float'));
    expect(Math.round(after.left - before.left)).toBe(-400);
    expect(Math.round(after.top - before.top)).toBe(-300);
    expect(await isOpen(help)).toBe(false);
    const saved = JSON.parse(await page.evaluate(() => webui.storage.getItem('webui-page-help-position')));
    expect(saved).toEqual({ right: Math.round(1000 - after.right), bottom: Math.round(700 - after.bottom) });
    // A help bubble on the next page starts where this one was left.
    const next = await ready(page, '<webui-page-help><p>Next page</p></webui-page-help>');
    await expect.poll(async () => Math.round((await box(next.locator('.float'))).left)).toBe(Math.round(after.left));
    await next.locator('button.bubble').click();
    await expect.poll(() => isOpen(next)).toBe(true);
});
test('a small movement is still a click', async ({ page }) => {
    const help = await ready(page);
    await drag(page, help, 2, 1);
    await expect.poll(() => isOpen(help)).toBe(true);
});
test('it cannot be dragged out of the window, and stays in view when the window shrinks', async ({ page }) => {
    const help = await ready(page);
    await drag(page, help, -2000, -2000);
    let b = await box(help.locator('.float'));
    expect(Math.abs(Math.round(b.left))).toBe(0);
    expect(Math.abs(Math.round(b.top))).toBe(0);
    await drag(page, help, 900, 300);
    await page.setViewportSize({ width: 600, height: 400 });
    await expect.poll(async () => (await box(help.locator('.float'))).right).toBeLessThanOrEqual(600);
    b = await box(help.locator('.float'));
    expect(b.bottom).toBeLessThanOrEqual(400);
    expect(b.left).toBeGreaterThanOrEqual(0);
});
test('a separate storage key keeps a separate position, and resetPosition returns it to the corner', async ({ page }) => {
    const help = await ready(page, '<webui-page-help storage-key="demo-help"><p>x</p></webui-page-help>');
    const start = await box(help.locator('.float'));
    await drag(page, help, -300, -200);
    expect(await page.evaluate(() => webui.storage.getItem('demo-help'))).toContain('right');
    expect(await page.evaluate(() => webui.storage.getItem('webui-page-help-position'))).toBe('');
    await help.evaluate(el => el.resetPosition());
    await expect.poll(async () => Math.round((await box(help.locator('.float'))).left)).toBe(Math.round(start.left));
    expect(await page.evaluate(() => webui.storage.getItem('demo-help'))).toBe('');
});
test('a damaged saved position is ignored', async ({ page }) => {
    await page.evaluate(() => webui.storage.setItem('webui-page-help-position', '{not json'));
    const help = await ready(page);
    const b = await box(help.locator('button.bubble'));
    expect(1000 - b.right).toBeLessThan(40);
});
test('a transformed ancestor does not move the bubble off the window corner', async ({ page }) => {
    const help = await ready(page, `<div style="transform: translateX(0); position: absolute; top: 50px; left: 50px; width: 300px; height: 300px;">${HELP}</div>`);
    const b = await box(help.locator('.float'));
    expect(1000 - b.right).toBeLessThan(40);
    expect(700 - b.bottom).toBeLessThan(40);
});
test('open and close can be called directly', async ({ page }) => {
    const help = await ready(page);
    await help.evaluate(el => el.open());
    await expect.poll(() => isOpen(help)).toBe(true);
    await help.evaluate(el => el.close());
    await expect.poll(() => isOpen(help)).toBe(false);
});
test('leaving the page closes an open dialog', async ({ page }) => {
    const help = await ready(page);
    await help.locator('button.bubble').click();
    await page.evaluate(() => document.getElementById('test-root').innerHTML = '');
    expect(await help.count()).toBe(0);
    // A modal left open would make the rest of the page inert.
    await page.evaluate(() => { const b = document.createElement('button'); b.id = 'after'; b.textContent = 'After'; document.body.appendChild(b); });
    await page.locator('#after').click({ timeout: 2000 });
});
