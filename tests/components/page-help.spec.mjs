import { test, expect, mount } from '../support/webui.mjs';

const HELP = '<webui-page-help heading="Page Help"><p class="content">How to use this page.</p><button class="inside">Inside</button></webui-page-help>';
const ready = async (page, html = HELP) => {
    const root = await mount(page, html);
    const help = root.locator('webui-page-help');
    await help.evaluate(el => customElements.upgrade(el));
    return help;
};
// Where an element is, only to aim the mouse at it, as a person would. Tests check what is saved, shown, and usable,
// never positions: where the help sits is checked by eye.
const box = locator => locator.evaluate(el => {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
});
const panel = help => help.locator('.panel');
const saved = (page, key) => page.evaluate(key => JSON.parse(webui.storage.getItem(key) || 'null'), key);
const BUBBLE_KEY = 'webui-page-help-position';
const PANEL_KEY = 'webui-page-help-position-panel';
/** The panel or bubble shows inside the window. Positions are rounded, so a fraction of a pixel can pass the edge. */
const inWindow = locator => expect(locator).toBeInViewport({ ratio: 0.95 });
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

test('a bubble shows in the window, and nothing shows without content', async ({ page }) => {
    const help = await ready(page);
    const bubble = help.locator('button.bubble');
    await expect(bubble).toBeVisible();
    await expect(bubble).toHaveText('Help');
    await inWindow(bubble);
    await expect(help.locator('p.content')).toBeHidden();
    const empty = await ready(page, '<webui-page-help> </webui-page-help>');
    await expect(empty.locator('button.bubble')).toBeHidden();
});
test('a footer along the bottom of the window stays usable beside the bubble', async ({ page }) => {
    const help = await ready(page, `<footer style="position:fixed;left:0;right:0;bottom:0;height:60px;background:#333"><button id="footer-end" style="position:absolute;right:4px;bottom:4px">End</button></footer>${HELP}`);
    // Real clicks, which Playwright refuses when another element, such as the bubble, would take them.
    await page.locator('#footer-end').click();
    await help.locator('button.bubble').click();
    await expect.poll(() => isOpen(help)).toBe(true);
});
test('a docked drawer\'s buttons stay usable beside the bubble', async ({ page }) => {
    const drawer = '<webui-drawer slot="right" class="shared" data-dockable docked="true" style="position:fixed;right:0;top:0;height:100%;width:300px">Panel</webui-drawer>';
    const help = await ready(page, `${drawer}${HELP}`);
    // A real click on the drawer's close button, at the bottom right where the bubble starts.
    await page.locator('webui-drawer .drawer-close').click();
    await expect(page.locator('webui-drawer')).not.toHaveAttribute('docked');
    await help.locator('button.bubble').click();
    await expect.poll(() => isOpen(help)).toBe(true);
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
test('the panel first opens whole, inside the window', async ({ page }) => {
    const help = await ready(page);
    await help.locator('button.bubble').click();
    await inWindow(panel(help));
});
test('the panel can be dragged by its header, and opens where it was left', async ({ page }) => {
    const help = await ready(page);
    await help.locator('button.bubble').click();
    expect(await saved(page, PANEL_KEY)).toBeNull();
    await drag(page, help, -200, -150, help.locator('.panel header'), { x: 20, y: 10 });
    expect(await isOpen(help)).toBe(true);
    const place = await saved(page, PANEL_KEY);
    expect(place).toEqual({ left: expect.any(Number), top: expect.any(Number) });
    await help.locator('.panel button.close').click();
    await expect.poll(() => isOpen(help)).toBe(false);
    // The help on another page opens where the panel was left.
    const next = await ready(page, '<webui-page-help><p>Next page</p></webui-page-help>');
    await next.locator('button.bubble').click();
    await expect.poll(() => panel(next).evaluate(el => [el.style.left, el.style.top])).toEqual([`${place.left}px`, `${place.top}px`]);
    await inWindow(panel(next));
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
            selectStartAllowed: document.dispatchEvent(new Event('selectstart', { cancelable: true })),
        }));
        await page.mouse.up();
        return during;
    };
    await help.locator('button.bubble').click();
    const panelDrag = await selectionDuring(help.locator('.panel header'), { x: 20, y: 10 });
    expect(panelDrag).toEqual({ selected: '', selectStartAllowed: false });
    await help.locator('.panel button.close').click();
    await expect.poll(() => isOpen(help)).toBe(false);
    const bubbleDrag = await selectionDuring(help.locator('button.bubble'), { x: 10, y: 10 });
    expect(bubbleDrag).toEqual({ selected: '', selectStartAllowed: false });
    // The page can select text again afterwards.
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
    await inWindow(panel(help));
    await drag(page, help, 3000, 3000, help.locator('.panel header'), { x: 20, y: 10 });
    await inWindow(panel(help));
    await page.setViewportSize({ width: 500, height: 350 });
    await inWindow(panel(help));
});
test('the panel can be resized from its corner, and keeps that size', async ({ page }) => {
    const help = await ready(page);
    await help.locator('button.bubble').click();
    await drag(page, help, -300, -300, help.locator('.panel header'), { x: 20, y: 10 });
    // Only a size the user chose is saved.
    expect(Object.keys(await saved(page, PANEL_KEY))).toEqual(['left', 'top']);
    const panelBox = await box(panel(help));
    await drag(page, help, 120, 90, panel(help), { x: panelBox.width - 3, y: panelBox.height - 3 });
    const size = await saved(page, PANEL_KEY);
    expect(size).toEqual({ left: expect.any(Number), top: expect.any(Number), width: expect.any(Number), height: expect.any(Number) });
    await help.locator('.panel button.close').click();
    await expect.poll(() => isOpen(help)).toBe(false);
    // Opened again, it has the size chosen.
    await help.locator('button.bubble').click();
    await expect.poll(() => panel(help).evaluate(el => [el.style.width, el.style.height])).toEqual([`${size.width}px`, `${size.height}px`]);
});
test('content that renders after opening leaves the panel whole inside the window, scrolling inside it', async ({ page }) => {
    const help = await ready(page, '<webui-page-help heading="Page Help"><div class="late">Loading</div></webui-page-help>');
    await help.locator('button.bubble').click();
    // Help content often loads after the panel opens, such as markdown from a file.
    await help.locator('.late').evaluate(el => { el.style.height = '2000px'; el.style.width = '900px'; });
    await inWindow(panel(help));
    // The content scrolls inside the panel instead.
    expect(await help.locator('.panel .body').evaluate(el => { el.scrollTop = 100000; return el.scrollTop > 0; })).toBe(true);
});
test('content that renders while the panel animates open still leaves it whole inside the window', async ({ page }) => {
    // Apps play the opening animation, and their help content often renders during it.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const help = await ready(page, '<webui-page-help heading="Page Help"><div class="late">Loading</div></webui-page-help>');
    await help.locator('button.bubble').click();
    await page.waitForTimeout(50);
    await help.locator('.late').evaluate(el => { el.style.height = '2000px'; el.style.width = '900px'; });
    // Once the animation ends, the panel is whole and inside the window.
    await expect.poll(async () => (await panel(help).evaluate(el => el.getAnimations().length))).toBe(0);
    await inWindow(panel(help));
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
    await inWindow(panel(help));
});
test('the panel can be resized from its top left corner and its edges, but not past the window or below its smallest size', async ({ page }) => {
    const help = await ready(page);
    await help.locator('button.bubble').click();
    await drag(page, help, -250, -200, help.locator('.resize[data-edge="nw"]'));
    // Resizing saves the size chosen.
    expect(await saved(page, PANEL_KEY)).toEqual({ left: expect.any(Number), top: expect.any(Number), width: expect.any(Number), height: expect.any(Number) });
    await drag(page, help, -5000, 0, help.locator('.resize[data-edge="w"]'));
    await inWindow(panel(help));
    await drag(page, help, 0, -5000, help.locator('.resize[data-edge="n"]'));
    await inWindow(panel(help));
    // It cannot shrink below its smallest size, which the component keeps at 120px high.
    await drag(page, help, 0, 5000, help.locator('.resize[data-edge="n"]'));
    expect((await saved(page, PANEL_KEY)).height).toBe(120);
});
test('dragging moves the bubble without opening it, and the position is remembered', async ({ page }) => {
    const help = await ready(page);
    expect(await saved(page, BUBBLE_KEY)).toBeNull();
    await drag(page, help, -400, -300);
    expect(await isOpen(help)).toBe(false);
    const place = await saved(page, BUBBLE_KEY);
    expect(place).toEqual({ right: expect.any(Number), bottom: expect.any(Number) });
    // A help bubble on the next page starts where this one was left.
    const next = await ready(page, '<webui-page-help><p>Next page</p></webui-page-help>');
    await expect.poll(() => next.locator('.float').evaluate(el => [el.style.right, el.style.bottom])).toEqual([`${place.right}px`, `${place.bottom}px`]);
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
    // Checked on its wrapper, since the bubble grows a little while the mouse is over it, as it is after a drag.
    await drag(page, help, -2000, -2000);
    await inWindow(help.locator('.float'));
    await drag(page, help, 900, 300);
    await page.setViewportSize({ width: 600, height: 400 });
    await inWindow(help.locator('.float'));
});
test('a separate storage key keeps a separate position, and resetPosition forgets it', async ({ page }) => {
    const help = await ready(page, '<webui-page-help storage-key="demo-help"><p>x</p></webui-page-help>');
    await drag(page, help, -300, -200);
    expect(await page.evaluate(() => webui.storage.getItem('demo-help'))).toContain('right');
    expect(await page.evaluate(() => webui.storage.getItem('webui-page-help-position'))).toBe('');
    await help.locator('button.bubble').click();
    await drag(page, help, -100, -100, help.locator('.panel header'), { x: 20, y: 10 });
    expect(await page.evaluate(() => webui.storage.getItem('demo-help-panel'))).toContain('left');
    await help.evaluate(el => el.resetPosition());
    expect(await page.evaluate(() => webui.storage.getItem('demo-help'))).toBe('');
    expect(await page.evaluate(() => webui.storage.getItem('demo-help-panel'))).toBe('');
    // Both show whole, back where they start.
    await inWindow(help.locator('button.bubble'));
    await inWindow(panel(help));
});
test('a damaged saved position is ignored', async ({ page }) => {
    await page.evaluate(() => webui.storage.setItem('webui-page-help-position', '{not json'));
    const help = await ready(page);
    await inWindow(help.locator('button.bubble'));
});
test('a transformed ancestor does not hide the bubble', async ({ page }) => {
    const help = await ready(page, `<div style="transform: translateX(0); position: absolute; top: 50px; left: 50px; width: 300px; height: 300px;">${HELP}</div>`);
    await inWindow(help.locator('button.bubble'));
    await help.locator('button.bubble').click();
    await expect.poll(() => isOpen(help)).toBe(true);
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
