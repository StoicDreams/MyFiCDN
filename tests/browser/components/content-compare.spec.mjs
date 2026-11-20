import { test, expect, mount } from '../support/webui.mjs';

const lines = (...text) => text.map(line => ({ line }));

const compare = async page => {
    const root = await mount(page, '<webui-content-compare style="display:block;height:300px"></webui-content-compare>');
    return root.locator('webui-content-compare');
};

test('shows its lines without a set height', async ({ page }) => {
    const root = await mount(page, '<div><webui-content-compare></webui-content-compare></div>');
    const el = root.locator('webui-content-compare');
    await el.evaluate((c, [a, b]) => c.setDiff(a, b), [lines('a', 'b', 'c'), lines('a', 'x', 'c')]);
    await expect(el.locator('.diff-row')).toHaveCount(3);
    // Without a set height, the scrolling area must still fit its rows, or it clips them out of sight.
    await expect(el.locator('.diff-row').last()).toBeInViewport();
});

test('scrolls within a set height', async ({ page }) => {
    const root = await mount(page, '<webui-content-compare style="height:200px"></webui-content-compare>');
    const el = root.locator('webui-content-compare');
    const many = Array.from({ length: 100 }, (_, i) => `line ${i}`);
    await el.evaluate((c, [a, b]) => c.setDiff(a, b), [lines(...many), lines(...many.map(l => `${l}!`))]);
    await el.locator('.toggle-mode').check();
    // A hundred lines don't fit, so the lines scroll inside it.
    await expect.poll(() => el.evaluate(c => {
        const box = c.shadowRoot.querySelector('.compare-container');
        box.scrollTop = 100000;
        return box.scrollTop > 0;
    })).toBe(true);
});
