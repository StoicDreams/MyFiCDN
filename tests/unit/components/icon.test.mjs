import { test, expect, mount } from '../support/webui.mjs';
import { readFileSync, readdirSync } from 'node:fs';

// Drawing is what webui-icon does, so these tests check what it draws (Websites/CLAUDE.md, What tests check).
const path = (el, n) => el.locator(`path.i${n}`);
// Chrome reports stroke widths that use a variable as calc(16.1px) rather than 16.1px, so tests read the number.

test('loads and draws the named icon', async ({ page }) => {
    const root = await mount(page, '<webui-icon icon="xmark"></webui-icon>');
    const el = root.locator('webui-icon');
    await expect(path(el, 1)).toHaveAttribute('d', /^M/);
    await expect.poll(() => el.evaluate(c => c._definition)).toContain('WEBUI-ICON-');
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
    await expect.poll(() => root.locator('webui-icon').evaluate(c => c._definition || '')).toContain('WEBUI-ICON-NOT-FOUND');
});
test('the latest icon wins when icons load out of order', async ({ page }) => {
    // The bell is held until the newer icon has drawn, so it arrives last.
    let release;
    const held = new Promise(resolve => { release = resolve; });
    await page.route('**/icons/bell.webui', async route => {
        await held;
        await route.fallback();
    });
    const root = await mount(page, '<webui-icon icon="bell"></webui-icon>');
    const el = root.locator('webui-icon').first();
    await el.evaluate(c => c.setAttribute('icon', 'xmark'));
    await expect.poll(() => el.evaluate(c => c._definition || '')).toContain('XMARK');
    // A second icon waits on the same bell request, after the first, so once it draws the bell the first has
    // been given it too.
    await root.evaluate(r => r.insertAdjacentHTML('beforeend', '<webui-icon id="second" icon="bell"></webui-icon>'));
    release();
    await expect.poll(() => root.locator('#second').evaluate(c => c._definition || '')).toContain('BELL');
    await expect.poll(() => el.evaluate(c => c._definition)).toContain('XMARK');
});
test('pipe delimited flags set and remove attributes', async ({ page }) => {
    const root = await mount(page, '<webui-icon icon="xmark|fill|shade:tri|shape:circle|-backing" backing></webui-icon>');
    const el = root.locator('webui-icon');
    await expect(el).toHaveAttribute('fill', 'true');
    await expect(el).toHaveAttribute('shade', 'tri');
    await expect(el).toHaveAttribute('shape', 'circle');
    await expect(el).not.toHaveAttribute('backing');
});
test('pipe delimited flags are removed when the next icon value leaves them out', async ({ page }) => {
    const root = await mount(page, '<webui-icon icon="bell|fill|ban" theme="info"></webui-icon>');
    const el = root.locator('webui-icon');
    await expect(el).toHaveAttribute('fill', 'true');
    await el.evaluate(c => c.setAttribute('icon', 'bell|ban|theme:warning'));
    await expect(el).not.toHaveAttribute('fill');
    await expect(el).toHaveAttribute('ban', 'true');
    await expect(el).toHaveAttribute('theme', 'warning');
    await el.evaluate(c => c.setAttribute('icon', 'bell'));
    await expect(el).not.toHaveAttribute('ban');
    // A theme set directly on the element is kept, even after a piped value changed it.
    await expect(el).toHaveAttribute('theme', 'warning');
});
for (const shape of ['octo', 'octogon', 'tri', 'triangle', 'badge', 'circle', 'cloud', 'file', 'shield', 'book', 'gear', 'chart', 'calendar', 'heart', 'note', 'scroll', 'window', 'tv', 'other']) {
    test(`shape ${shape} draws a backing`, async ({ page }) => {
        const root = await mount(page, `<webui-icon shape="${shape}"></webui-icon>`);
        await expect(root.locator('webui-icon path.backing')).toHaveAttribute('d', /^M/);
    });
}
test('rotate turns each path and can be cleared', async ({ page }) => {
    const root = await mount(page, '<webui-icon icon="xmark" rotate="90"></webui-icon>');
    const el = root.locator('webui-icon');
    await expect.poll(() => path(el, 1).evaluate(p => p.style.transform)).toBe('rotate(90deg)');
    await el.evaluate(c => c.setAttribute('rotate', '0'));
    await expect.poll(() => path(el, 1).evaluate(p => p.style.transform)).toBe('');
});
test('stroke sets a width and can be cleared', async ({ page }) => {
    const root = await mount(page, '<webui-icon stroke="thin"></webui-icon>');
    const el = root.locator('webui-icon');
    const stroke = () => el.evaluate(c => c._svg.style.getPropertyValue('--ico-stroke-width'));
    await expect.poll(() => stroke()).toBe('5');
    await el.evaluate(c => c.setAttribute('stroke', 'thick'));
    await expect.poll(() => stroke()).toBe('15');
    await el.evaluate(c => c.setAttribute('stroke', '7'));
    await expect.poll(() => stroke()).toBe('7');
    await el.evaluate(c => c.removeAttribute('stroke'));
    await expect.poll(() => stroke()).toBe('');
});
test('shadow only sets the shadow, and width and height set size', async ({ page }) => {
    const root = await mount(page, '<webui-icon shadow="1px 1px 2px red" width="20" height="30"></webui-icon>');
    await expect.poll(() => root.locator('webui-icon').evaluate(c => [c._svg.style.filter, c.style.width, c.style.height])).toEqual(['drop-shadow(red 1px 1px 2px)', '20px', '30px']);
});
test('count displays', async ({ page }) => {
    const root = await mount(page, '<webui-icon count="1200"></webui-icon>');
    await expect(root.locator('webui-icon slot[name="count"]')).toHaveText('1,200');
});
test('theme swaps the color pair, and clearing removes it', async ({ page }) => {
    const root = await mount(page, '<webui-icon theme="info"></webui-icon>');
    const el = root.locator('webui-icon');
    const color = () => el.evaluate(c => c.style.getPropertyValue('--theme-color'));
    await expect.poll(() => color()).toBe('var(--color-info-offset)');
    await el.evaluate(c => c.setTheme(''));
    await expect.poll(() => color()).toBe('');
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
    await expect.poll(() => emoji.evaluate(e => e.style.transform)).toBe('rotate(45deg)');
    await expect(el.locator('svg.main')).toHaveClass(/emoji/);
    await el.evaluate(c => c.setAttribute('icon', 'xmark'));
    await expect(el.locator('svg.main')).not.toHaveClass(/emoji/);
    await expect(emoji).toHaveText('');
});
test('icons without a name are hidden from screen readers, and named icons are images', async ({ page }) => {
    const root = await mount(page, '<webui-icon id="plain" icon="xmark"></webui-icon><webui-icon id="named" icon="xmark" title="Close"></webui-icon>');
    await expect(root.locator('#plain')).toHaveAttribute('aria-hidden', 'true');
    await expect(root.locator('#named')).toHaveAttribute('role', 'img');
    await expect(root.locator('#named')).toHaveAttribute('aria-label', 'Close');
    await expect(root.locator('#named')).not.toHaveAttribute('aria-hidden');
});
test('icons morph: every path keeps the same commands when the icon changes', async ({ page }) => {
    const root = await mount(page, '<webui-icon icon="gear"></webui-icon>');
    const el = root.locator('webui-icon');
    await expect.poll(() => el.evaluate(c => c._definition || '')).toContain('GEAR');
    const shape = () => el.evaluate(c => c._dynPaths.map(p => (p.getAttribute('d') || '').replace(/-?\d+(\.\d+)?/g, '#')));
    const before = await shape();
    await el.evaluate(c => c.setAttribute('icon', 'xmark'));
    await expect.poll(() => el.evaluate(c => c._definition || '')).toContain('XMARK');
    // The same letters in the same order, so the browser can animate each path from one icon to the other.
    await expect.poll(() => shape()).toEqual(before);
});
test('setIcon changes the icon, so data can drive it', async ({ page }) => {
    const root = await mount(page, '<webui-button data-trigger="icon-demo" data-value="gear">Settings</webui-button><webui-icon icon="hamburger" data-subscribe="icon-demo:setIcon"></webui-icon>');
    const el = root.locator('webui-icon');
    await expect.poll(() => el.evaluate(c => c._definition || '')).toContain('HAMBURGER');
    await root.locator('webui-button').click();
    await expect(el).toHaveAttribute('icon', 'gear');
    await expect.poll(() => el.evaluate(c => c._definition || '')).toContain('GEAR');
});

// Every icon in cdn/icons, checked against the format webui-icon and the icon creator expect. Browsers only
// animate between paths with the same commands, so every path must be a start point and exactly 11 curves.
const DIR = new URL('../../../cdn/icons/', import.meta.url);
const names = readdirSync(DIR).filter(f => f.endsWith('.webui')).map(f => f.slice(0, -6)).sort();
const N = String.raw`-?\d+(?:\.\d+)?`;
const PATH = new RegExp(String.raw`^M\s*${N}[\s,]+${N}(?:\s*Q\s*${N}[\s,]+${N}[\s,]+${N}[\s,]+${N}){11}\s*z$`);
const PREFIX = /^(bi|duo|tri|trio|\d+)$/;

test('every icon file is a valid icon definition', () => {
    const problems = [];
    for (const name of names) {
        const lines = readFileSync(new URL(`${name}.webui`, DIR), 'utf8').replace(/\r/g, '').split('\n').filter(Boolean);
        if (lines[0] !== `WEBUI-ICON-${name.toUpperCase()}`) problems.push(`${name}: the first line is not WEBUI-ICON-${name.toUpperCase()}`);
        const paths = lines.slice(1);
        if (paths.length < 1 || paths.length > 10) problems.push(`${name}: ${paths.length} paths, but webui-icon draws 1 to 10`);
        paths.forEach((line, i) => {
            const parts = line.split('|');
            const d = parts.pop();
            if (parts.some(p => !PREFIX.test(p))) problems.push(`${name} path ${i + 1}: unknown prefix ${parts.join('|')}`);
            if (!PATH.test(d)) problems.push(`${name} path ${i + 1}: not a start point and 11 curves`);
            if (d.match(/-?\d+(\.\d+)?/g).map(Number).some(n => n < -100 || n > 100)) problems.push(`${name} path ${i + 1}: a point is outside -100 to 100`);
        });
    }
    expect(problems).toEqual([]);
});

test('all.json lists every icon, so Icon Search can find it', () => {
    const listed = JSON.parse(readFileSync(new URL('all.json', DIR), 'utf8')).map(entry => entry.name).sort();
    expect(listed).toEqual(names);
});
test('flip mirrors the icon, and combines with rotate', async ({ page }) => {
    const root = await mount(page, '<webui-icon icon="undo"></webui-icon>');
    const el = root.locator('webui-icon');
    const transform = () => path(el, 1).evaluate(p => p.style.transform);
    await el.evaluate(c => c.setAttribute('flip', ''));
    await expect.poll(() => transform()).toBe('scale(-1, 1)');
    await el.evaluate(c => c.setAttribute('flip', 'y'));
    await expect.poll(() => transform()).toBe('scale(1, -1)');
    await el.evaluate(c => c.setAttribute('rotate', '90'));
    await expect.poll(() => transform()).toBe('rotate(90deg) scale(1, -1)');
    await el.evaluate(c => { c.removeAttribute('flip'); c.removeAttribute('rotate'); });
    await expect.poll(() => transform()).toBe('');
    // The piped form works too, such as undo|flip for redo.
    await el.evaluate(c => c.setAttribute('icon', 'undo|flip'));
    await expect.poll(transform).toBe('scale(-1, 1)');
});
test('a shape before the icon name draws it in that shape, and clears with the next icon', async ({ page }) => {
    const root = await mount(page, '<webui-icon icon="circle_check|bordered"></webui-icon>');
    const el = root.locator('webui-icon');
    await expect(el).toHaveAttribute('shape', 'circle');
    await expect.poll(() => el.evaluate(c => c._iconRequest)).toBe('check');
    await el.evaluate(c => c.setAttribute('icon', 'check_shield|bordered'));
    await expect(el).toHaveAttribute('shape', 'shield');
    await expect.poll(() => el.evaluate(c => c._iconRequest)).toBe('check');
    await el.evaluate(c => c.setAttribute('icon', 'check|bordered'));
    await expect(el).not.toHaveAttribute('shape');
});
test('the shape first wins when both readings fit, and other underscores are left alone', async ({ page }) => {
    const root = await mount(page, '<webui-icon icon="shield_circle"></webui-icon>');
    const el = root.locator('webui-icon');
    await expect(el).toHaveAttribute('shape', 'shield');
    await expect.poll(() => el.evaluate(c => c._iconRequest)).toBe('circle');
    // An emoji name with a shape word at the end is still the emoji.
    await el.evaluate(c => c.setAttribute('icon', 'emoji-red_circle'));
    await expect.poll(() => el.evaluate(c => c._iconRequest)).toBe('emoji-red_circle');
    await expect(el).not.toHaveAttribute('shape');
    await el.evaluate(c => c.setAttribute('icon', 'circle_emoji-crossed_swords|inverted'));
    await expect(el).toHaveAttribute('shape', 'circle');
    await expect.poll(() => el.evaluate(c => c._iconRequest)).toBe('emoji-crossed_swords');
});
