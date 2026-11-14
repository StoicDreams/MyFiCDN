import { test, expect, mount } from '../support/webui.mjs';

const html = (attributes = '') => `<webui-tabs ${attributes}>
<webui-button slot="tabs" hash="one">1</webui-button><div slot="content">A</div>
<webui-button slot="tabs" hash="two">2</webui-button><div slot="content">B</div>
<webui-button slot="tabs">3</webui-button><div slot="content"><input name="field"></div></webui-tabs>`;
const tabs = async (page, attributes) => (await mount(page, html(attributes))).locator('webui-tabs');
const buttons = el => el.locator(':scope > [slot="tabs"]');

test('starts on the first tab and marks it active', async ({ page }) => {
    const el = await tabs(page);
    await expect(buttons(el).first()).toHaveAttribute('theme', 'active');
    await expect(buttons(el).nth(1)).not.toHaveAttribute('theme');
});
test('clicking a tab moves to its content', async ({ page }) => {
    const el = await tabs(page, 'transition-timing="0"');
    await buttons(el).nth(1).click();
    await expect(buttons(el).nth(1)).toHaveAttribute('theme', 'active');
    expect(await el.evaluate(c => [c._index, c._slotContent.style.translate])).toEqual([1, '-100%']);
});
test('tabs with a hash update the url, without history on first load', async ({ page }) => {
    const before = await page.evaluate(() => history.length);
    const el = await tabs(page);
    await expect(page).toHaveURL(/#one$/);
    expect(await page.evaluate(() => history.length)).toBe(before);
    await buttons(el).nth(1).click();
    await expect(page).toHaveURL(/#two$/);
    expect(await page.evaluate(() => history.length)).toBe(before + 1);
});
test('the tab named in the url starts selected', async ({ page }) => {
    await page.evaluate(() => history.replaceState(null, '', '#two'));
    const before = await page.evaluate(() => history.length);
    const el = await tabs(page);
    await expect(buttons(el).nth(1)).toHaveAttribute('theme', 'active');
    await expect(page).toHaveURL(/#two$/);
    expect(await page.evaluate(() => history.length)).toBe(before);
    await buttons(el).first().click();
    await expect(page).toHaveURL(/#one$/);
});
test('the tab named in the url also updates the saved index', async ({ page }) => {
    await page.evaluate(() => {
        history.replaceState(null, '', '#two');
        webui.setData('tb-saved', 0);
    });
    const el = await tabs(page, 'data-subscribe="tb-saved:setTab"');
    await expect(buttons(el).nth(1)).toHaveAttribute('theme', 'active');
    await expect.poll(() => page.evaluate(() => webui.getData('tb-saved'))).toBe(1);
});
test('a hash for something else is left alone', async ({ page }) => {
    await page.evaluate(() => history.replaceState(null, '', '#some-heading'));
    const el = await tabs(page);
    await expect(buttons(el).first()).toHaveAttribute('theme', 'active');
    await expect(page).toHaveURL(/#some-heading$/);
});
test('fields in hidden tabs are disabled', async ({ page }) => {
    const el = await tabs(page);
    await expect(el.locator('input')).toHaveAttribute('disabled', 'true');
    await buttons(el).nth(2).click();
    await expect(el.locator('input')).not.toHaveAttribute('disabled');
});
test('the tab index syncs with data', async ({ page }) => {
    const el = await tabs(page, 'data-subscribe="tb-index:setTab"');
    await buttons(el).nth(1).click();
    expect(await page.evaluate(() => webui.getData('tb-index'))).toBe(1);
    await page.evaluate(() => webui.setData('tb-index', 2));
    await expect(buttons(el).nth(2)).toHaveAttribute('theme', 'active');
});
test('a saved index past the end falls back to the last tab', async ({ page }) => {
    await page.evaluate(() => webui.setData('tb-far', 9));
    const el = await tabs(page, 'data-subscribe="tb-far:setTab"');
    await expect(buttons(el).nth(2)).toHaveAttribute('theme', 'active');
});
test('vertical tabs do not scroll the page on load', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 300 });
    await page.evaluate(() => { document.body.style.paddingTop = '1000px'; });
    await tabs(page, 'vertical');
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
});
test('narrow windows stack the tabs', async ({ page }) => {
    const el = await tabs(page);
    await expect(el).not.toHaveAttribute('narrow');
    await page.setViewportSize({ width: 600, height: 700 });
    await expect(el).toHaveAttribute('narrow', 'true');
    await page.setViewportSize({ width: 1200, height: 700 });
    await expect(el).not.toHaveAttribute('narrow');
});
test('setData builds tabs from templates', async ({ page }) => {
    const root = await mount(page, `<webui-tabs>
<template slot="template" name="label">{LABEL}!</template>
<template slot="template" name="content">Body {CONTENT}</template></webui-tabs>`);
    const el = root.locator('webui-tabs');
    await el.evaluate(c => c.setData([{ label: 'A', content: 'x' }, {}, { label: 'B', content: 'y' }]));
    await expect(buttons(el)).toHaveCount(2);
    await expect(buttons(el).first()).toContainText('A!');
    await expect(el.locator(':scope > [slot="content"]').nth(1)).toContainText('Body y');
    await el.evaluate(c => c.setData([{ label: 'C', content: 'z' }]));
    await expect(buttons(el)).toHaveCount(1);
});
test('pad and transition timing apply', async ({ page }) => {
    const el = await tabs(page, 'pad="4" transition-timing="200"');
    expect(await el.evaluate(c => [c.style.getPropertyValue('--theme-padding'), c._slotContent.style.transitionDuration])).toEqual(['4px', '200ms']);
});
test('the index attribute picks the starting tab, and later switches tabs', async ({ page }) => {
    const el = await tabs(page, 'index="1" transition-timing="0"');
    await expect(buttons(el).nth(1)).toHaveAttribute('theme', 'active');
    expect(await el.evaluate(c => c._index)).toBe(1);
    await el.evaluate(c => c.setAttribute('index', '2'));
    await expect(buttons(el).nth(2)).toHaveAttribute('theme', 'active');
});
test('fields in the starting tab are enabled and fields in other tabs are disabled', async ({ page }) => {
    const root = await mount(page, `<webui-tabs index="1"><webui-button slot="tabs">A</webui-button><div slot="content"><input name="a"></div><webui-button slot="tabs">B</webui-button><div slot="content"><input name="b"></div></webui-tabs>`);
    await expect(root.locator('input[name="a"]')).toBeDisabled();
    await expect(root.locator('input[name="b"]')).toBeEnabled();
});
test('a field disabled by its page stays disabled when its tab opens', async ({ page }) => {
    const root = await mount(page, `<webui-tabs><webui-button slot="tabs">A</webui-button><div slot="content"><input name="keep" disabled><input name="free"></div><webui-button slot="tabs">B</webui-button><div slot="content">B</div></webui-tabs>`);
    const el = root.locator('webui-tabs');
    await el.evaluate(c => c.setTab(1));
    await expect(root.locator('input[name="free"]')).toBeDisabled();
    await el.evaluate(c => c.setTab(0));
    await expect(root.locator('input[name="free"]')).toBeEnabled();
    await expect(root.locator('input[name="keep"]')).toBeDisabled();
});
test('the shown tab is marked current, and other tabs are out of reach', async ({ page }) => {
    const el = await tabs(page, 'transition-timing="0"');
    await expect(buttons(el).first()).toHaveAttribute('aria-current', 'true');
    const panels = el.locator(':scope > [slot="content"]');
    await expect.poll(() => panels.evaluateAll(list => list.map(p => p.inert))).toEqual([false, true, true]);
    await buttons(el).nth(2).click();
    await expect(buttons(el).nth(2)).toHaveAttribute('aria-current', 'true');
    await expect(buttons(el).first()).not.toHaveAttribute('aria-current');
    await expect.poll(() => panels.evaluateAll(list => list.map(p => p.inert))).toEqual([true, true, false]);
});
test('a short tab is not as tall as a longer hidden tab, and a shown tab gets its full height', async ({ page }) => {
    // Hidden tabs collapse on a timer once the slide ends. Hold timers of the slide's length, so the test checks the
    // slide's start and end without racing the timer, which a busy machine loses.
    await page.evaluate(() => {
        const setTimeoutReal = window.setTimeout;
        window.__held = [];
        window.setTimeout = function (callback, ms, ...args) {
            if (ms !== 230) return setTimeoutReal(callback, ms, ...args);
            window.__held.push(() => callback(...args));
            return setTimeoutReal(() => { }, 0);
        };
        window.__releaseHeld = () => window.__held.splice(0).forEach(run => run());
    });
    const endSlide = () => page.evaluate(() => window.__releaseHeld());
    const el = (await mount(page, `<webui-tabs transition-timing="230">
<webui-button slot="tabs">Short</webui-button><div slot="content"><div style="height:100px">A</div></div>
<webui-button slot="tabs">Tall</webui-button><div slot="content"><div style="height:900px">B</div></div></webui-tabs>`)).locator('webui-tabs');
    const height = () => el.evaluate(t => Math.round(t.getBoundingClientRect().height));
    const contentHeights = () => el.evaluate(t => [...t.querySelectorAll('[slot="content"]')].map(c => Math.round(c.getBoundingClientRect().height)));
    await expect.poll(height).toBeLessThan(300);
    await buttons(el).nth(1).click();
    // The tab being shown has its full height at once, and the one sliding away keeps its height until it is gone.
    expect(await contentHeights()).toEqual([900, 900]);
    await expect.poll(height).toBeGreaterThan(900);
    await endSlide();
    await expect.poll(contentHeights).toEqual([0, 900]);
    await buttons(el).first().click();
    await endSlide();
    await expect.poll(height).toBeLessThan(300);
    await expect.poll(contentHeights).toEqual([100, 0]);
});
