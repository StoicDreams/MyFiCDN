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
const panel = help => help.locator('.panel');
const isOpen = help => help.evaluate(el => el.isOpen());
// The element with focus, looking through shadow roots.
const focused = page => page.evaluate(() => {
    let active = document.activeElement;
    while (active && active.shadowRoot && active.shadowRoot.activeElement) active = active.shadowRoot.activeElement;
    return active ? `${active.tagName.toLowerCase()}.${active.className}` : null;
});
// Drags from the middle of an element, or from a point given relative to its top left.
const drag = async (page, help, dx, dy, target = help.locator('button.bubble'), at) => {
    const b = await box(target);
    const x = b.left + (at ? at.x : b.width / 2), y = b.top + (at ? at.y : b.height / 2);
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
    await expect(help.locator('.panel h2')).toHaveText('Guide');
    await help.evaluate(el => el.setAttribute('heading', 'All About Guides'));
    await expect(help.locator('.panel h2')).toHaveText('All About Guides');
});
test('clicking the bubble opens the content in a panel', async ({ page }) => {
    const help = await ready(page);
    await help.locator('button.bubble').click();
    await expect(panel(help)).toBeVisible();
    await expect(help.locator('.panel h2')).toHaveText('Page Help');
    await expect(help.locator('p.content')).toBeVisible();
    await expect(help.locator('button.bubble')).toHaveCSS('opacity', '0');
    // Content stays usable, since it is shown in place rather than copied.
    await page.evaluate(() => { window.__clicked = 0; document.querySelector('button.inside').addEventListener('click', () => window.__clicked++); });
    await help.locator('button.inside').click();
    expect(await page.evaluate(() => window.__clicked)).toBe(1);
});
test('the page stays usable while the panel is open', async ({ page }) => {
    const help = await ready(page, `<button id="page-button" style="position:fixed;left:20px;top:20px">Page</button><input id="page-input" style="position:fixed;left:20px;top:60px" />${HELP}`);
    await page.evaluate(() => { window.__pageClicks = 0; document.getElementById('page-button').addEventListener('click', () => window.__pageClicks++); });
    await help.locator('button.bubble').click();
    await page.locator('#page-button').click({ timeout: 2000 });
    expect(await page.evaluate(() => window.__pageClicks)).toBe(1);
    await page.locator('#page-input').fill('typing while reading');
    await expect(page.locator('#page-input')).toHaveValue('typing while reading');
    // Neither clicking the page nor Escape from the page closes it.
    await page.keyboard.press('Escape');
    expect(await isOpen(help)).toBe(true);
    await expect(panel(help)).toBeVisible();
});
test('the close button and Escape in the panel close it, and focus returns to the bubble', async ({ page }) => {
    const help = await ready(page);
    await help.locator('button.bubble').click();
    await help.locator('.panel button.close').click();
    await expect.poll(() => isOpen(help)).toBe(false);
    await expect(panel(help)).toBeHidden();
    await expect.poll(() => focused(page)).toBe('button.bubble');
    await page.keyboard.press('Enter');
    await expect.poll(() => isOpen(help)).toBe(true);
    await page.keyboard.press('Escape');
    await expect.poll(() => isOpen(help)).toBe(false);
});
test('closing from code leaves focus on the page', async ({ page }) => {
    const help = await ready(page, `<input id="page-input" style="position:fixed;left:20px;top:60px" />${HELP}`);
    await help.evaluate(el => el.open());
    await page.locator('#page-input').focus();
    await help.evaluate(el => el.close());
    await expect.poll(() => isOpen(help)).toBe(false);
    expect(await focused(page)).toBe('input.');
});
test('it grows out of the bubble and shrinks back into it', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const help = await ready(page);
    await page.evaluate(() => {
        window.__animations = [];
        const original = HTMLElement.prototype.animate;
        HTMLElement.prototype.animate = function (frames, options) {
            if (this.classList.contains('panel')) window.__animations.push(frames.map(f => f.transform));
            return original.call(this, frames, options);
        };
    });
    await help.locator('button.bubble').click();
    await expect.poll(() => page.evaluate(() => window.__animations.length)).toBe(1);
    await help.locator('.panel button.close').click();
    await expect.poll(() => isOpen(help)).toBe(false);
    const [opening, closing] = await page.evaluate(() => window.__animations);
    expect(opening[0]).toMatch(/scale\(0\.\d+\)/);
    expect(opening[1]).toContain('scale(1)');
    expect(closing[1]).toMatch(/scale\(0\.\d+\)/);
});
test('the panel first opens at the bubble\'s corner', async ({ page }) => {
    const help = await ready(page);
    const bubble = await box(help.locator('.float'));
    await help.locator('button.bubble').click();
    const p = await box(panel(help));
    expect(Math.abs(p.right - bubble.right)).toBeLessThanOrEqual(1);
    expect(Math.abs(p.bottom - bubble.bottom)).toBeLessThanOrEqual(1);
});
test('the panel can be dragged by its header, and opens where it was left', async ({ page }) => {
    const help = await ready(page);
    await help.locator('button.bubble').click();
    const before = await box(panel(help));
    await drag(page, help, -200, -150, help.locator('.panel header'), { x: 20, y: 10 });
    const after = await box(panel(help));
    expect(Math.round(after.left - before.left)).toBe(-200);
    expect(Math.round(after.top - before.top)).toBe(-150);
    expect(await isOpen(help)).toBe(true);
    const saved = JSON.parse(await page.evaluate(() => webui.storage.getItem('webui-page-help-position-panel')));
    expect(saved).toEqual({ left: Math.round(after.left), top: Math.round(after.top) });
    await help.locator('.panel button.close').click();
    await expect.poll(() => isOpen(help)).toBe(false);
    // The help on another page opens in the same place.
    const next = await ready(page, '<webui-page-help><p>Next page</p></webui-page-help>');
    await next.locator('button.bubble').click();
    const reopened = await box(panel(next));
    expect(Math.round(reopened.left)).toBe(Math.round(after.left));
    expect(Math.round(reopened.top)).toBe(Math.round(after.top));
});
test('dragging the panel or bubble across the page does not select text', async ({ page }) => {
    const words = Array.from({ length: 200 }, (_, i) => `word${i}`).join(' ');
    const help = await ready(page, `<p id="page-text" style="position:fixed;left:0;top:0;width:900px">${words}</p>${HELP}`);
    await page.evaluate(() => { document.documentElement.style.userSelect = 'text'; });
    const selectionDuring = async (target, at) => {
        const b = await box(target);
        await page.mouse.move(b.left + at.x, b.top + at.y);
        await page.mouse.down();
        await page.mouse.move(60, 40, { steps: 6 });
        await page.mouse.move(20, 20, { steps: 6 });
        const during = await page.evaluate(() => ({
            selected: window.getSelection().toString(),
            blocked: getComputedStyle(document.documentElement).userSelect,
            selectStartAllowed: document.dispatchEvent(new Event('selectstart', { cancelable: true })),
        }));
        await page.mouse.up();
        return during;
    };
    await help.locator('button.bubble').click();
    const panelDrag = await selectionDuring(help.locator('.panel header'), { x: 20, y: 10 });
    expect(panelDrag).toEqual({ selected: '', blocked: 'none', selectStartAllowed: false });
    await help.locator('.panel button.close').click();
    await expect.poll(() => isOpen(help)).toBe(false);
    const bubbleDrag = await selectionDuring(help.locator('button.bubble'), { x: 10, y: 10 });
    expect(bubbleDrag).toEqual({ selected: '', blocked: 'none', selectStartAllowed: false });
    // The page can select text again afterwards, with its own setting put back.
    expect(await page.evaluate(() => document.documentElement.style.userSelect)).toBe('text');
    expect(await page.evaluate(() => document.dispatchEvent(new Event('selectstart', { cancelable: true })))).toBe(true);
});
test('pressing the close button does not drag the panel', async ({ page }) => {
    const help = await ready(page);
    await help.locator('button.bubble').click();
    const close = await box(help.locator('.panel button.close'));
    await page.mouse.move(close.left + close.width / 2, close.top + close.height / 2);
    await page.mouse.down();
    await page.mouse.move(close.left - 100, close.top - 100, { steps: 3 });
    await page.mouse.up();
    expect(await page.evaluate(() => webui.storage.getItem('webui-page-help-position-panel'))).toBe('');
});
test('the panel cannot be dragged out of the window, and stays in view when the window shrinks', async ({ page }) => {
    const help = await ready(page);
    await help.locator('button.bubble').click();
    await drag(page, help, -3000, -3000, help.locator('.panel header'), { x: 20, y: 10 });
    let p = await box(panel(help));
    expect(Math.abs(Math.round(p.left))).toBe(0);
    expect(Math.abs(Math.round(p.top))).toBe(0);
    await drag(page, help, 3000, 3000, help.locator('.panel header'), { x: 20, y: 10 });
    await page.setViewportSize({ width: 500, height: 350 });
    await expect.poll(async () => (await box(panel(help))).right).toBeLessThanOrEqual(500);
    p = await box(panel(help));
    expect(p.bottom).toBeLessThanOrEqual(350);
    expect(p.left).toBeGreaterThanOrEqual(0);
    expect(p.top).toBeGreaterThanOrEqual(0);
});
test('the panel can be resized from its corner, and keeps that size', async ({ page }) => {
    const help = await ready(page);
    await help.locator('button.bubble').click();
    await drag(page, help, -300, -300, help.locator('.panel header'), { x: 20, y: 10 });
    const before = await box(panel(help));
    await drag(page, help, 120, 90, panel(help), { x: before.width - 3, y: before.height - 3 });
    const after = await box(panel(help));
    expect(Math.round(after.width - before.width)).toBeGreaterThan(100);
    expect(Math.round(after.height - before.height)).toBeGreaterThan(70);
    const saved = JSON.parse(await page.evaluate(() => webui.storage.getItem('webui-page-help-position-panel')));
    expect(saved.width).toBe(Math.round(after.width));
    expect(saved.height).toBe(Math.round(after.height));
    await help.locator('.panel button.close').click();
    await expect.poll(() => isOpen(help)).toBe(false);
    await help.locator('button.bubble').click();
    const reopened = await box(panel(help));
    expect(Math.round(reopened.width)).toBe(Math.round(after.width));
    expect(Math.round(reopened.height)).toBe(Math.round(after.height));
});
test('content that renders after opening grows the panel upward from the bubble, inside the window', async ({ page }) => {
    const help = await ready(page, '<webui-page-help heading="Page Help"><div class="late">Loading</div></webui-page-help>');
    const bubble = await box(help.locator('.float'));
    await help.locator('button.bubble').click();
    // Help content often loads after the panel opens, such as markdown from a file.
    await help.locator('.late').evaluate(el => { el.style.height = '2000px'; el.style.width = '900px'; });
    await expect.poll(async () => (await box(panel(help))).height).toBeGreaterThan(400);
    const p = await box(panel(help));
    expect(Math.abs(p.right - bubble.right)).toBeLessThanOrEqual(1);
    expect(Math.abs(p.bottom - bubble.bottom)).toBeLessThanOrEqual(1);
    expect(p.top).toBeGreaterThanOrEqual(0);
    expect(p.left).toBeGreaterThanOrEqual(0);
    // The content scrolls inside the panel instead.
    expect(await help.locator('.panel .body').evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
});
test('content that renders while the panel animates open still leaves it in view at the bubble', async ({ page }) => {
    // Apps play the opening animation, and their help content often renders during it.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const help = await ready(page, '<webui-page-help heading="Page Help"><div class="late">Loading</div></webui-page-help>');
    const bubble = await box(help.locator('.float'));
    await help.locator('button.bubble').click();
    await page.waitForTimeout(50);
    await help.locator('.late').evaluate(el => { el.style.height = '2000px'; el.style.width = '900px'; });
    // Once the animation ends, the panel is whole and inside the window.
    await expect.poll(async () => (await panel(help).evaluate(el => el.getAnimations().length))).toBe(0);
    const p = await box(panel(help));
    expect(p.height).toBeGreaterThan(400);
    expect(Math.abs(p.right - bubble.right)).toBeLessThanOrEqual(1);
    expect(Math.abs(p.bottom - bubble.bottom)).toBeLessThanOrEqual(1);
    expect(p.top).toBeGreaterThanOrEqual(0);
    expect(p.left).toBeGreaterThanOrEqual(0);
});
test('a panel opened where it was left stays in view when content renders while it animates open', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    // Where a small panel was left, near the bottom right of the window.
    await page.addInitScript(() => sessionStorage.setItem('webui-page-help-position-panel', JSON.stringify({ left: 780, top: 640 })));
    const help = await ready(page, '<webui-page-help heading="Page Help"><div class="late">Loading</div></webui-page-help>');
    await help.evaluate(() => webui.storage.setItem('webui-page-help-position-panel', JSON.stringify({ left: 780, top: 640 })));
    await help.locator('button.bubble').click();
    await page.waitForTimeout(50);
    await help.locator('.late').evaluate(el => { el.style.height = '2000px'; el.style.width = '900px'; });
    await expect.poll(async () => (await panel(help).evaluate(el => el.getAnimations().length))).toBe(0);
    await page.waitForTimeout(100);
    const p = await box(panel(help));
    expect(p.height).toBeGreaterThan(400);
    expect(p.right).toBeLessThanOrEqual(1000);
    expect(p.bottom).toBeLessThanOrEqual(700);
    expect(p.top).toBeGreaterThanOrEqual(0);
    expect(p.left).toBeGreaterThanOrEqual(0);
});
test('the panel can be resized from its top left corner and its edges, but not past the window', async ({ page }) => {
    const help = await ready(page);
    await help.locator('button.bubble').click();
    const before = await box(panel(help));
    await drag(page, help, -250, -200, help.locator('.resize[data-edge="nw"]'));
    let after = await box(panel(help));
    expect(Math.round(after.width - before.width)).toBe(250);
    expect(Math.round(after.height - before.height)).toBe(200);
    // The opposite corner stays put.
    expect(Math.round(after.right)).toBe(Math.round(before.right));
    expect(Math.round(after.bottom)).toBe(Math.round(before.bottom));
    const saved = JSON.parse(await page.evaluate(() => webui.storage.getItem('webui-page-help-position-panel')));
    expect(saved).toEqual({ left: Math.round(after.left), top: Math.round(after.top), width: Math.round(after.width), height: Math.round(after.height) });
    await drag(page, help, -5000, 0, help.locator('.resize[data-edge="w"]'));
    after = await box(panel(help));
    expect(Math.round(after.left)).toBe(0);
    await drag(page, help, 0, -5000, help.locator('.resize[data-edge="n"]'));
    expect(Math.round((await box(panel(help))).top)).toBe(0);
    // It cannot shrink below its smallest size.
    await drag(page, help, 0, 5000, help.locator('.resize[data-edge="n"]'));
    expect(Math.round((await box(panel(help))).height)).toBe(120);
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
test('a separate storage key keeps a separate position, and resetPosition returns everything to the corner', async ({ page }) => {
    const help = await ready(page, '<webui-page-help storage-key="demo-help"><p>x</p></webui-page-help>');
    const start = await box(help.locator('.float'));
    await drag(page, help, -300, -200);
    expect(await page.evaluate(() => webui.storage.getItem('demo-help'))).toContain('right');
    expect(await page.evaluate(() => webui.storage.getItem('webui-page-help-position'))).toBe('');
    await help.locator('button.bubble').click();
    await drag(page, help, -100, -100, help.locator('.panel header'), { x: 20, y: 10 });
    expect(await page.evaluate(() => webui.storage.getItem('demo-help-panel'))).toContain('left');
    await help.evaluate(el => el.resetPosition());
    await expect.poll(async () => Math.round((await box(help.locator('.float'))).left)).toBe(Math.round(start.left));
    expect(await page.evaluate(() => webui.storage.getItem('demo-help'))).toBe('');
    expect(await page.evaluate(() => webui.storage.getItem('demo-help-panel'))).toBe('');
    // The open panel moves back to the bubble's corner too.
    const bubble = await box(help.locator('.float'));
    const p = await box(panel(help));
    expect(Math.abs(p.right - bubble.right)).toBeLessThanOrEqual(1);
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
test('open, close, and toggle can be called directly', async ({ page }) => {
    const help = await ready(page);
    await help.evaluate(el => el.open());
    await expect.poll(() => isOpen(help)).toBe(true);
    await help.evaluate(el => el.close());
    await expect.poll(() => isOpen(help)).toBe(false);
    await help.evaluate(el => el.toggle());
    await expect.poll(() => isOpen(help)).toBe(true);
    await help.evaluate(el => el.toggle());
    await expect.poll(() => isOpen(help)).toBe(false);
});
test('leaving the page removes an open panel', async ({ page }) => {
    const help = await ready(page);
    await help.locator('button.bubble').click();
    await page.evaluate(() => document.getElementById('test-root').innerHTML = '');
    expect(await help.count()).toBe(0);
    expect(await page.evaluate(() => document.querySelectorAll(':popover-open').length)).toBe(0);
});
