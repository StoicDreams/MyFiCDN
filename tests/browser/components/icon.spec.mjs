import { test, expect, mount } from '../support/webui.mjs';
import { readFileSync, readdirSync } from 'node:fs';

// Drawing is what webui-icon does, so these tests check what it draws (Websites/CLAUDE.md, What tests check).
const path = (el, n) => el.locator(`path.i${n}`);
// Chrome reports stroke widths that use a variable as calc(16.1px) rather than 16.1px, so tests read the number.

for (const shape of ['octo', 'octogon', 'tri', 'triangle', 'badge', 'circle', 'cloud', 'file', 'shield', 'book', 'gear', 'chart', 'calendar', 'heart', 'note', 'scroll', 'window', 'tv', 'other']) {
}

// Every icon in cdn/icons, checked against the format webui-icon and the icon creator expect. Browsers only
// animate between paths with the same commands, so every path must be a start point and exactly 11 curves.
const DIR = new URL('../../../cdn/icons/', import.meta.url);
const names = readdirSync(DIR).filter(f => f.endsWith('.webui')).map(f => f.slice(0, -6)).sort();
const N = String.raw`-?\d+(?:\.\d+)?`;
const PATH = new RegExp(String.raw`^M\s*${N}[\s,]+${N}(?:\s*Q\s*${N}[\s,]+${N}[\s,]+${N}[\s,]+${N}){11}\s*z$`);
const PREFIX = /^(bi|duo|tri|trio|\d+)$/;

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
test('every shape with room inside keeps the shrunken icon clear of its outline', async ({ page }) => {
    const shapes = ['file', 'cloud', 'book', 'gear', 'calendar', 'heart', 'note', 'scroll', 'window', 'tv'];
    const root = await mount(page, shapes.map(shape => `<webui-icon icon="table|shape:${shape}|bordered" width="200"></webui-icon>`).join(''));
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

test('setIconDefinition applies shades and clears unused paths', async ({ page }) => {
    const root = await mount(page, '<webui-icon></webui-icon>');
    const el = root.locator('webui-icon');
    await el.evaluate(c => c.setIconDefinition('WEBUI-ICON-T\nduo|M1 1z\ntri|M2 2z\n5|M3 3z\nM4 4z'));
    await expect(path(el, 1)).toHaveClass(/duo/);
    await expect(path(el, 1)).toHaveAttribute('d', 'M1 1z');
    await expect(path(el, 2)).toHaveClass(/tri/);
    await expect.poll(() => path(el, 3).evaluate(p => parseFloat(getComputedStyle(p).strokeWidth.replace(/[^\d.]/g, '')))).toBe(5);
    await expect(path(el, 4)).toHaveAttribute('d', 'M4 4z');
    await expect(path(el, 5)).toHaveAttribute('d', /^M0 0Q0 0/);
    await el.evaluate(c => c.clearPaths());
    await expect(path(el, 1)).toHaveAttribute('d', /^M0 0Q0 0/);
});

test('a path line can set a shade and a stroke width, and morphing resets both', async ({ page }) => {
    const root = await mount(page, '<webui-icon></webui-icon>');
    const el = root.locator('webui-icon');
    await el.evaluate(c => c.setIconDefinition('WEBUI-ICON-A\nbi|20|M0 0Q1 1 2 2z\n30|M0 0Q1 1 2 2z'));
    // Widths are drawn as given; the inline style also divides by the shape scale, which is 1 here.
    await expect.poll(() => path(el, 1).evaluate(p => [p.classList.contains('duo'), parseFloat(getComputedStyle(p).strokeWidth.replace(/[^\d.]/g, ''))])).toEqual([true, 20]);
    await expect.poll(() => path(el, 2).evaluate(p => [p.classList.contains('duo'), parseFloat(getComputedStyle(p).strokeWidth.replace(/[^\d.]/g, ''))])).toEqual([false, 30]);
    await el.evaluate(c => c.setIconDefinition('WEBUI-ICON-B\nM0 0Q1 1 2 2z\ntri|M0 0Q1 1 2 2z'));
    // A path that changes icon keeps neither the old shade nor the old width.
    await expect.poll(() => path(el, 1).evaluate(p => [p.classList.contains('duo'), p.style.strokeWidth])).toEqual([false, '']);
    await expect.poll(() => path(el, 2).evaluate(p => [p.classList.contains('tri'), p.style.strokeWidth])).toEqual([true, '']);
});

test('filled icons fill with the icon color', async ({ page }) => {
    const root = await mount(page, '<webui-icon icon="circle" fill style="--theme-color-offset: rgb(200, 10, 10)"></webui-icon>');
    const el = root.locator('webui-icon');
    await expect(path(el, 1)).toHaveAttribute('d', /^M/);
    await expect.poll(() => path(el, 1).evaluate(p => [getComputedStyle(p).fill, getComputedStyle(p).stroke])).toEqual(['rgb(200, 10, 10)', 'rgb(200, 10, 10)']);
});

test('the backing only draws when it is filled or bordered', async ({ page }) => {
    const root = await mount(page, '<webui-icon id="plain" icon="xmark"></webui-icon><webui-icon id="backed" icon="xmark" backing></webui-icon><webui-icon id="bordered" icon="xmark" bordered></webui-icon>');
    const display = id => root.locator(`#${id} path.backing`).evaluate(p => getComputedStyle(p).display);
    await expect.poll(() => display('plain')).toBe('none');
    await expect.poll(() => display('backed')).not.toBe('none');
    await expect.poll(() => display('bordered')).not.toBe('none');
});

test('ban cuts a gap through the icon either side of the slash, leaving the shape border whole', async ({ page }) => {
    const root = await mount(page, '<webui-icon icon="circle_users|ban|bordered|fill"></webui-icon>');
    const el = root.locator('webui-icon');
    await expect(el).toHaveAttribute('ban', 'true');
    const cut = await el.evaluate(c => {
        const shadow = c.shadowRoot;
        const group = shadow.querySelector('g.cut');
        const style = s => getComputedStyle(shadow.querySelector(s));
        const width = s => parseFloat(style(s).strokeWidth);
        return {
            mask: group.getAttribute('mask'),
            glyphMasked: group.contains(shadow.querySelector('g.glyph')),
            backingMasked: group.contains(shadow.querySelector('path.backing')),
            cutColor: [style('path.ban-cut').fill, style('path.ban-cut').stroke],
            wider: width('path.ban-cut') > width('path.ban'),
        };
    });
    // A mask, not a stroke painted in a background color, so the gap shows whatever is behind the icon.
    expect(cut).toEqual({ mask: 'url(#ban-cut)', glyphMasked: true, backingMasked: false, cutColor: ['rgb(0, 0, 0)', 'rgb(0, 0, 0)'], wider: true });
    await el.evaluate(c => c.setAttribute('icon', 'circle_users|bordered'));
    await expect(el).not.toHaveAttribute('ban');
    await expect.poll(() => el.evaluate(c => c.shadowRoot.querySelector('g.cut').hasAttribute('mask'))).toBe(false);
});
