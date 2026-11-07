import { test, expect, mount } from '../support/webui.mjs';
import { readFileSync, readdirSync } from 'node:fs';

const path = (el, n) => el.locator(`path.i${n}`);
// Chrome reports stroke widths that use a variable as calc(16.1px) rather than 16.1px, so tests read the number.

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
for (const shape of ['octo', 'octogon', 'tri', 'triangle', 'badge', 'circle', 'cloud', 'file', 'shield', 'other']) {
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
    expect(await path(el, 3).evaluate(p => parseFloat(getComputedStyle(p).strokeWidth.replace(/[^\d.]/g, '')))).toBe(5);
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
test('icons without a name are hidden from screen readers, and named icons are images', async ({ page }) => {
    const root = await mount(page, '<webui-icon id="plain" icon="xmark"></webui-icon><webui-icon id="named" icon="xmark" title="Close"></webui-icon>');
    await expect(root.locator('#plain')).toHaveAttribute('aria-hidden', 'true');
    await expect(root.locator('#named')).toHaveAttribute('role', 'img');
    await expect(root.locator('#named')).toHaveAttribute('aria-label', 'Close');
    await expect(root.locator('#named')).not.toHaveAttribute('aria-hidden');
});
test('a path line can set a shade and a stroke width, and morphing resets both', async ({ page }) => {
    const root = await mount(page, '<webui-icon></webui-icon>');
    const el = root.locator('webui-icon');
    await el.evaluate(c => c.setIconDefinition('WEBUI-ICON-A\nbi|20|M0 0Q1 1 2 2z\n30|M0 0Q1 1 2 2z'));
    // Widths are drawn as given; the inline style also divides by the shape scale, which is 1 here.
    expect(await path(el, 1).evaluate(p => [p.classList.contains('duo'), parseFloat(getComputedStyle(p).strokeWidth.replace(/[^\d.]/g, ''))])).toEqual([true, 20]);
    expect(await path(el, 2).evaluate(p => [p.classList.contains('duo'), parseFloat(getComputedStyle(p).strokeWidth.replace(/[^\d.]/g, ''))])).toEqual([false, 30]);
    await el.evaluate(c => c.setIconDefinition('WEBUI-ICON-B\nM0 0Q1 1 2 2z\ntri|M0 0Q1 1 2 2z'));
    // A path that changes icon keeps neither the old shade nor the old width.
    expect(await path(el, 1).evaluate(p => [p.classList.contains('duo'), p.style.strokeWidth])).toEqual([false, '']);
    expect(await path(el, 2).evaluate(p => [p.classList.contains('tri'), p.style.strokeWidth])).toEqual([true, '']);
});
test('filled icons fill with the icon color', async ({ page }) => {
    const root = await mount(page, '<webui-icon icon="circle" fill style="--theme-color-offset: rgb(200, 10, 10)"></webui-icon>');
    const el = root.locator('webui-icon');
    await expect(path(el, 1)).toHaveAttribute('d', /^M/);
    expect(await path(el, 1).evaluate(p => [getComputedStyle(p).fill, getComputedStyle(p).stroke])).toEqual(['rgb(200, 10, 10)', 'rgb(200, 10, 10)']);
});
test('the backing only draws when it is filled or bordered', async ({ page }) => {
    const root = await mount(page, '<webui-icon id="plain" icon="xmark"></webui-icon><webui-icon id="backed" icon="xmark" backing></webui-icon><webui-icon id="bordered" icon="xmark" bordered></webui-icon>');
    const display = id => root.locator(`#${id} path.backing`).evaluate(p => getComputedStyle(p).display);
    expect(await display('plain')).toBe('none');
    expect(await display('backed')).not.toBe('none');
    expect(await display('bordered')).not.toBe('none');
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
    expect(await shape()).toEqual(before);
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
const DIR = new URL('../../cdn/icons/', import.meta.url);
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
    expect(await transform()).toBe('scale(-1, 1)');
    await el.evaluate(c => c.setAttribute('flip', 'y'));
    expect(await transform()).toBe('scale(1, -1)');
    await el.evaluate(c => c.setAttribute('rotate', '90'));
    expect(await transform()).toBe('rotate(90deg) scale(1, -1)');
    await el.evaluate(c => { c.removeAttribute('flip'); c.removeAttribute('rotate'); });
    expect(await transform()).toBe('');
    // The piped form works too, such as undo|flip for redo.
    await el.evaluate(c => c.setAttribute('icon', 'undo|flip'));
    await expect.poll(transform).toBe('scale(-1, 1)');
});
test('inside a drawn shape the icon shrinks, keeping its line weight', async ({ page }) => {
    const root = await mount(page, '<webui-icon id="plain" icon="check"></webui-icon><webui-icon id="circled" icon="check|shape:circle|bordered"></webui-icon>');
    const measure = id => root.locator(`#${id}`).evaluate(c => {
        const g = c.shadowRoot.querySelector('g.glyph');
        const p = c.shadowRoot.querySelector('path.i1');
        return [getComputedStyle(g).transform, parseFloat(getComputedStyle(p).strokeWidth.replace(/[^\d.]/g, ''))];
    });
    await expect.poll(async () => (await measure('circled'))[0]).toMatch(/^matrix\(0\.62/);
    const [plainTransform, plainWidth] = await measure('plain');
    const [, circledWidth] = await measure('circled');
    expect(plainTransform).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
    // The stroke is widened by the same amount the icon shrinks, so the drawn line is the same thickness.
    expect(circledWidth * 0.62).toBeCloseTo(plainWidth, 1);
});
test('ban draws a slash with a gap in the background color', async ({ page }) => {
    const root = await mount(page, '<webui-icon icon="eye|ban" style="--theme-color: rgb(1, 2, 3)"></webui-icon>');
    const el = root.locator('webui-icon');
    await expect(el).toHaveAttribute('ban', 'true');
    const [gap, slash] = await el.evaluate(c => ['path.ban-gap', 'path.ban'].map(s => {
        const style = getComputedStyle(c.shadowRoot.querySelector(s));
        return { display: style.display, stroke: style.stroke, width: parseFloat(style.strokeWidth.replace(/[^\d.]/g, '')) };
    }));
    expect(gap.display).not.toBe('none');
    expect(gap.stroke).toBe('rgb(1, 2, 3)');
    expect(gap.width).toBeGreaterThan(slash.width);
});
test('cloud and file shapes keep the shrunken icon clear of their outline', async ({ page }) => {
    const root = await mount(page, '<webui-icon icon="table|shape:file|bordered" width="200"></webui-icon><webui-icon icon="table|shape:cloud|bordered" width="200"></webui-icon>');
    for (const el of await root.locator('webui-icon').all()) {
        await expect.poll(() => el.evaluate(c => c.shadowRoot.querySelector('g.glyph path').getAttribute('d'))).toMatch(/^M-?\d/);
        // Every point of the icon, at its scale inside the shape, is inside the outline with room for both strokes.
        const outside = await el.evaluate(c => {
            const back = c.shadowRoot.querySelector('path.backing');
            const svg = back.ownerSVGElement;
            const scale = parseFloat(getComputedStyle(c).getPropertyValue('--ico-glyph-scale'));
            const pts = [...c.shadowRoot.querySelectorAll('g.glyph path')].flatMap(p => (p.getAttribute('d').match(/-?\d+ -?\d+/g) || []).map(s => s.split(' ').map(Number)));
            const point = svg.createSVGPoint();
            return pts.filter(([x, y]) => {
                point.x = x * scale; point.y = y * scale;
                return !back.isPointInFill(point);
            });
        });
        expect(outside).toEqual([]);
    }
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
