import { test, expect, mount } from '../support/webui.mjs';

const countFetches = page => page.evaluate(() => {
    window.__count = 0;
    const original = window.fetch;
    window.fetch = (url, init) => { if (`${url}`.includes('robots.txt')) window.__count++; return original(url, init); };
});

test('children detach while hidden and return with their height held', async ({ page }) => {
    const root = await mount(page, '<webui-content><p style="height:50px">Body</p></webui-content>');
    const el = root.locator('webui-content');
    await expect(el).toHaveAttribute('visible', '1');
    const state = await el.evaluate(async c => {
        c.removeAttribute('visible');
        const hidden = [c.querySelector('p'), c.style.height !== ''];
        c.setAttribute('visible', '1');
        return [hidden[0], hidden[1], !!c.querySelector('p')];
    });
    expect(state).toEqual([null, true, true]);
});

test('content that fits does not scroll, whatever margins its children have', async ({ page }) => {
    // In a grid, as a page section holds it, the content's own height is set, which the margins once overflowed.
    const root = await mount(page, '<div style="display:grid"><webui-content><h1 style="margin:8px 0 16px">Title</h1><p style="margin:8px 0">Text</p></webui-content></div>');
    const content = root.locator('webui-content');
    await expect(content).toHaveClass(/loaded/);
    await expect.poll(() => content.evaluate(el => el.scrollHeight - el.clientHeight)).toBe(0);
});
