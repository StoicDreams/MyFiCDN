import { test, expect, mount } from '../support/webui.mjs';

const lines = (...text) => text.map(line => ({ line }));

const compare = async page => {
    const root = await mount(page, '<webui-content-compare style="display:block;height:300px"></webui-content-compare>');
    return root.locator('webui-content-compare');
};

test('setDiff marks equal, replaced, deleted, and inserted lines', async ({ page }) => {
    const el = await compare(page);
    const diff = await el.evaluate((c, [a, b]) => { c.setDiff(a, b); return c._diffTypes; }, [lines('same', 'old', 'gone', 'end'), lines('same', 'new', 'end', 'added')]);
    expect(diff).toEqual(['equal', 'replace', 'delete', 'equal', 'insert']);
});
test('identical content has no changes', async ({ page }) => {
    const el = await compare(page);
    expect(await el.evaluate((c, a) => { c.setDiff(a, a); return c._diffTypes.every(t => t === 'equal'); }, lines('a', 'b'))).toBe(true);
});
test('empty sides are all inserts or all deletes', async ({ page }) => {
    const el = await compare(page);
    expect(await el.evaluate((c, a) => {
        c.setDiff([], a);
        const inserts = [...c._diffTypes];
        c.setDiff(a, null);
        return [inserts, [...c._diffTypes]];
    }, lines('a', 'b'))).toEqual([['insert', 'insert'], ['delete', 'delete']]);
});
test('clear empties the view', async ({ page }) => {
    const el = await compare(page);
    expect(await el.evaluate((c, a) => {
        c.setDiff(a, lines2(a));
        function lines2(x) { return x.map(l => ({ line: `${l.line}!` })); }
        c.clear();
        return [c._diffTypes.length, c._scrollContainer.innerHTML];
    }, lines('a'))).toEqual([0, '']);
});
test('the toggle switches between changes and full view', async ({ page }) => {
    const el = await compare(page);
    const toggle = el.locator('.toggle-mode');
    await el.evaluate((c, [a, b]) => c.setDiff(a, b), [lines('a', 'b'), lines('a', 'c')]);
    expect(await el.evaluate(c => c._viewMode)).toBe('changes');
    await toggle.evaluate(t => { t.checked = true; t.dispatchEvent(new Event('change')); });
    expect(await el.evaluate(c => c._viewMode)).toBe('full');
});
test('shows its lines without a set height', async ({ page }) => {
    const root = await mount(page, '<div><webui-content-compare></webui-content-compare></div>');
    const el = root.locator('webui-content-compare');
    await el.evaluate((c, [a, b]) => c.setDiff(a, b), [lines('a', 'b', 'c'), lines('a', 'x', 'c')]);
    await expect(el.locator('.diff-row')).toHaveCount(3);
    // Each row is at least a line tall, so the scrolling area must fit all three.
    await expect.poll(() => el.evaluate(c => c.shadowRoot.querySelector('.compare-container').clientHeight)).toBeGreaterThan(60);
});
test('scrolls within a set height', async ({ page }) => {
    const root = await mount(page, '<webui-content-compare style="height:200px"></webui-content-compare>');
    const el = root.locator('webui-content-compare');
    const many = Array.from({ length: 100 }, (_, i) => `line ${i}`);
    await el.evaluate((c, [a, b]) => c.setDiff(a, b), [lines(...many), lines(...many.map(l => `${l}!`))]);
    await el.locator('.toggle-mode').check();
    await expect.poll(() => el.evaluate(c => c.getBoundingClientRect().height)).toBe(200);
    await expect.poll(() => el.evaluate(c => {
        const box = c.shadowRoot.querySelector('.compare-container');
        return box.scrollHeight > box.clientHeight;
    })).toBe(true);
});
