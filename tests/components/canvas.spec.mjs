import { test, expect, mount } from '../support/webui.mjs';

const canvas = async page => {
    const root = await mount(page, '<webui-canvas style="display:block;width:400px;height:200px" line-numbers></webui-canvas>');
    const el = root.locator('webui-canvas');
    await expect.poll(() => el.evaluate(c => c._canvas.width)).toBe(400);
    return el;
};

test('long lines wrap without losing text, and every line fits', async ({ page }) => {
    const el = await canvas(page);
    const source = `${'x'.repeat(50)}${' word '.repeat(300)}`;
    const result = await el.evaluate((c, source) => {
        c.setFromText(`${source}\nshort`);
        const lines = c._wrappedLines.filter(l => l.line !== undefined);
        const max = c._canvas.width - 50;
        return {
            joined: lines.filter(l => l.lineNumber === 1).map(l => l.text).join(''),
            multiple: lines.filter(l => l.lineNumber === 1).length > 1,
            fits: lines.every(l => c._ctx.measureText(l.text).width <= max),
            last: lines.at(-1).text,
        };
    }, source);
    expect(result).toEqual({ joined: source, multiple: true, fits: true, last: 'short' });
});
test('setFromText ignores unchanged text and does not change the input array', async ({ page }) => {
    const el = await canvas(page);
    expect(await el.evaluate(c => {
        c.setFromText('a\nb');
        const first = c._lines;
        c.setFromText('a\nb');
        const input = [{ line: 'z' }];
        const sameRender = c._lines === first;
        c.setLines(input);
        return [sameRender, input.length, c._textLines];
    })).toEqual([true, 1, 'z']);
});
test('setFromHTML uses the text content', async ({ page }) => {
    const el = await canvas(page);
    expect(await el.evaluate(c => { c.setFromHTML('<b>bold</b>'); return c._textLines; })).toBe('bold');
});
test('setScroll stays within the content', async ({ page }) => {
    const el = await canvas(page);
    expect(await el.evaluate(c => {
        c.setFromText(Array.from({ length: 100 }, (_, i) => `${i}`).join('\n'));
        c.setScroll(-5);
        const low = c.getScroll();
        c.setScroll(99999);
        return [low, c.getScroll() === c._contentHeight - c._canvas.height];
    })).toEqual([0, true]);
});
test('keeps resizing after being moved', async ({ page }) => {
    const el = await canvas(page);
    await el.evaluate(c => { const p = c.parentNode; c.remove(); p.appendChild(c); });
    await expect.poll(() => el.evaluate(c => !!c._resizeObserver)).toBe(true);
    await el.evaluate(c => { c.style.width = '300px'; });
    await expect.poll(() => el.evaluate(c => c._canvas.width)).toBe(300);
});
