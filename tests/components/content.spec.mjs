import { test, expect, mount } from '../support/webui.mjs';

const countFetches = page => page.evaluate(() => {
    window.__count = 0;
    const original = window.fetch;
    window.fetch = (url, init) => { if (`${url}`.includes('robots.txt')) window.__count++; return original(url, init); };
});

test('inline html is displayed as loaded', async ({ page }) => {
    const root = await mount(page, '<webui-content><p>Inline</p></webui-content>');
    await expect(root.locator('webui-content')).toHaveClass(/loaded/);
    await expect(root.locator('webui-content p')).toHaveText('Inline');
});
test('src replaces itself with the content by default', async ({ page }) => {
    const root = await mount(page, '<webui-content src="/d/about.md" load-delay="0"></webui-content>');
    await expect(root.locator('webui-page-segment').first()).toBeVisible({ timeout: 8000 });
    await expect(root.locator('webui-content')).toHaveCount(0);
});
test('nest keeps the element and renders inside it', async ({ page }) => {
    const root = await mount(page, '<webui-content nest src="/robots.txt" load-delay="0"></webui-content>');
    await expect(root.locator('webui-content')).toContainText('User-agent', { timeout: 8000 });
    await expect(root.locator('webui-content')).toHaveClass(/loaded/);
});
test('hiding and showing nested content does not refetch or re-render it', async ({ page }) => {
    await countFetches(page);
    const root = await mount(page, '<webui-content nest src="/robots.txt" load-delay="0"></webui-content>');
    const el = root.locator('webui-content');
    await expect(el).toContainText('User-agent', { timeout: 8000 });
    await el.evaluate(c => { c.firstElementChild.dataset.kept = '1'; });
    for (let i = 0; i < 2; i++) {
        await el.evaluate(c => c.removeAttribute('visible'));
        await el.evaluate(c => c.setAttribute('visible', '1'));
        await page.waitForTimeout(150);
    }
    expect(await page.evaluate(() => window.__count)).toBe(1);
    await expect(el.locator('[data-kept]')).toHaveCount(1);
});
test('changing src loads the new content', async ({ page }) => {
    const root = await mount(page, '<webui-content nest src="/robots.txt" load-delay="0"></webui-content>');
    const el = root.locator('webui-content');
    await expect(el).toContainText('User-agent', { timeout: 8000 });
    await el.evaluate(c => c.setAttribute('src', '/d/about.md'));
    await expect(el.locator('webui-page-segment').first()).toBeVisible();
});
test('failures show a message and can retry', async ({ page }) => {
    const root = await mount(page, '<webui-content nest src="/missing.md" load-delay="0"></webui-content>');
    const el = root.locator('webui-content');
    await expect(el).toContainText('Failed to load content from /missing.md', { timeout: 8000 });
    expect(await el.evaluate(c => c._contentLoaded)).toBe(false);
});
test('full html documents are refused', async ({ page }) => {
    await page.route('**/doc.md', route => route.fulfill({ body: '<!DOCTYPE html><html></html>' }));
    const root = await mount(page, '<webui-content nest src="/doc.md" load-delay="0"></webui-content>');
    await expect(root.locator('webui-content')).toContainText('did not return expected', { timeout: 8000 });
});
test('setHtml sets content directly', async ({ page }) => {
    const root = await mount(page, '<webui-content></webui-content>');
    const el = root.locator('webui-content');
    await el.evaluate(c => c.setHtml('<p>Direct</p>'));
    await expect(el.locator('p')).toHaveText('Direct');
    expect(await el.evaluate(c => c.contentAttached)).toBe(true);
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
test('nodetach keeps children while hidden', async ({ page }) => {
    const root = await mount(page, '<webui-content nodetach><p>Body</p></webui-content>');
    const el = root.locator('webui-content');
    await el.evaluate(c => c.removeAttribute('visible'));
    await expect(el.locator('p')).toHaveCount(1);
});
