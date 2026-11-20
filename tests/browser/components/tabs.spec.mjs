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
    // Its content slides into view, where a click on it reaches it.
    const shown = el.locator(':scope > [slot="content"]').nth(1);
    await expect(shown).toBeInViewport();
    await expect.poll(() => shown.evaluate(content => {
        const box = content.getBoundingClientRect();
        return content.contains(document.elementFromPoint(box.left + 2, box.top + box.height / 2));
    })).toBe(true);
});
test('a later tab shows from its start even when the columns are not as wide as the tabs', async ({ page }) => {
    // WebKit could leave the columns a little off the tabs' width until they were resized, and sliding by index times
    // the width then drifted by more each tab, cutting off the left of later tabs. Narrower columns stand in for that.
    const root = await mount(page, `<webui-tabs style="width:400px">${Array.from({ length: 8 }, (_, i) =>
        `<webui-button slot="tabs">${i + 1}</webui-button><div slot="content"><span class="start" data-tab="${i + 1}">Start ${i + 1}</span></div>`).join('')}</webui-tabs>`);
    const el = root.locator('webui-tabs');
    await el.evaluate(tabs => tabs.shadowRoot.querySelector('slot[name="content"]').style.setProperty('grid-template-columns', Array(8).fill('calc(100% - 6px)').join(' ')));
    await buttons(el).nth(7).click();
    // A click at the very start of the last tab's content lands on it, so none of it is out of view.
    const start = el.locator('.start[data-tab="8"]');
    await expect(start).toBeVisible();
    await expect.poll(() => start.evaluate(span => {
        const box = span.getBoundingClientRect();
        return document.elementFromPoint(box.left + 1, box.top + box.height / 2) === span;
    })).toBe(true);
});

test('a tab that is no longer active drops its active theme, rather than taking a theme named null', async ({ page }) => {
    const el = await tabs(page, 'transition-timing="0"');
    const first = buttons(el).first();
    await expect(first).toHaveAttribute('theme', 'active');
    await buttons(el).nth(1).click();
    await expect(buttons(el).nth(1)).toHaveAttribute('theme', 'active');
    await expect(first).not.toHaveAttribute('theme');
    await expect.poll(() => first.evaluate(c => [c.style.getPropertyValue('--theme-color'), c.style.getPropertyValue('--theme-color-offset')])).toEqual(['', '']);
});
test('tabs with a hash update the url, without history on first load', async ({ page }) => {
    const before = await page.evaluate(() => history.length);
    const el = await tabs(page);
    await expect(page).toHaveURL(/#one$/);
    await expect.poll(() => page.evaluate(() => history.length)).toBe(before);
    await buttons(el).nth(1).click();
    await expect(page).toHaveURL(/#two$/);
    await expect.poll(() => page.evaluate(() => history.length)).toBe(before + 1);
});
test('the tab named in the url starts selected', async ({ page }) => {
    await page.evaluate(() => history.replaceState(null, '', '#two'));
    const before = await page.evaluate(() => history.length);
    const el = await tabs(page);
    await expect(buttons(el).nth(1)).toHaveAttribute('theme', 'active');
    await expect(page).toHaveURL(/#two$/);
    await expect.poll(() => page.evaluate(() => history.length)).toBe(before);
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
    await expect.poll(() => page.evaluate(() => webui.getData('tb-index'))).toBe(1);
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
    // Scrolling to the tabs is smooth, so it is counted when asked for instead of waiting to see the page move.
    await page.evaluate(() => {
        document.body.style.paddingTop = '1000px';
        window.__scrolls = 0;
        const scrollIntoView = Element.prototype.scrollIntoView;
        Element.prototype.scrollIntoView = function (...args) {
            if (this.nodeName === 'WEBUI-TABS') window.__scrolls++;
            return scrollIntoView.apply(this, args);
        };
    });
    const el = await tabs(page, 'vertical');
    // The first tab is selected once the tabs have set themselves up.
    await expect.poll(() => el.evaluate(c => c._initiated)).toBe(true);
    await expect(buttons(el).first()).toHaveAttribute('theme', 'active');
    const scrolled = await page.evaluate(() => [window.__scrolls, window.scrollY]);
    expect(scrolled).toEqual([0, 0]);
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
    await expect.poll(() => el.evaluate(c => [c.style.getPropertyValue('--theme-padding'), c._slotContent.style.transitionDuration])).toEqual(['4px', '200ms']);
});
test('the index attribute picks the starting tab, and later switches tabs', async ({ page }) => {
    const el = await tabs(page, 'index="1" transition-timing="0"');
    await expect(buttons(el).nth(1)).toHaveAttribute('theme', 'active');
    await expect.poll(() => el.evaluate(c => c._index)).toBe(1);
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
test('a hidden tab takes no room once the slide ends, so a short tab leaves nothing to scroll', async ({ page }) => {
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
    // A box around the tabs that is too short for the tall tab only scrolls while the tall tab is shown.
    const root = await mount(page, `<div id="box" style="height:300px;overflow:auto"><webui-tabs transition-timing="230">
<webui-button slot="tabs">Short</webui-button><div slot="content"><div style="height:100px">A</div></div>
<webui-button slot="tabs">Tall</webui-button><div slot="content"><div style="height:900px">B</div></div></webui-tabs></div>`);
    const el = root.locator('webui-tabs');
    const scrolls = () => root.locator('#box').evaluate(box => { box.scrollTop = 100000; const moved = box.scrollTop > 0; box.scrollTop = 0; return moved; });
    const hidden = () => el.evaluate(t => [...t.querySelectorAll('[slot="content"]')].map(c => c.hasAttribute('tab-hidden')));
    await expect.poll(hidden).toEqual([false, true]);
    await expect.poll(scrolls).toBe(false);
    await buttons(el).nth(1).click();
    // The tab being shown opens at once, and the one sliding away stays open until the slide ends.
    await expect.poll(() => hidden()).toEqual([false, false]);
    await expect.poll(scrolls).toBe(true);
    await endSlide();
    await expect.poll(hidden).toEqual([true, false]);
    await buttons(el).first().click();
    await endSlide();
    await expect.poll(hidden).toEqual([false, true]);
    await expect.poll(scrolls).toBe(false);
});

test('a label shows before the tabs, from the label attribute or an element in the label slot', async ({ page }) => {
    const root = await mount(page, `<webui-tabs id="a" label="Tools"><webui-button slot="tabs">One</webui-button><div slot="content">1</div></webui-tabs>
<webui-tabs id="b"><span slot="label" id="mine">Mine</span><webui-button slot="tabs">Two</webui-button><div slot="content">2</div></webui-tabs>
<webui-tabs id="c"><webui-button slot="tabs">Three</webui-button><div slot="content">3</div></webui-tabs>`);
    await expect(root.locator('#a .label')).toHaveText('Tools');
    await expect(root.locator('#a .label')).toBeVisible();
    await expect(root.locator('#a')).toHaveAttribute('labeled');
    await expect(root.locator('#mine')).toBeVisible();
    await expect(root.locator('#b')).toHaveAttribute('labeled');
    await expect(root.locator('#c .label')).toBeHidden();
    await expect(root.locator('#c')).not.toHaveAttribute('labeled');
    // The label sits in the tab bar, ahead of the buttons.
    await expect.poll(() => root.locator('#a').evaluate(el => {
        const bar = el.shadowRoot.querySelector('.bar');
        return [...bar.children].map(child => child.className || child.name);
    })).toEqual(['label', 'label', 'tabs']);
    await root.locator('#a').evaluate(el => el.removeAttribute('label'));
    await expect(root.locator('#a .label')).toBeHidden();
});
test.describe('sortable', () => {
    const TABS = `<webui-tabs id="s" sortable>
<webui-button slot="tabs" data-id="a">A</webui-button><div slot="content">Content A</div>
<webui-button slot="tabs" data-id="b">B</webui-button><div slot="content">Content B</div>
<webui-button slot="tabs" data-id="c">C</webui-button><div slot="content">Content C</div>
</webui-tabs>`;
    const order = el => el.evaluate(tabs => tabs.tabButtons().map(button => button.dataset.id));
    const contents = el => el.evaluate(tabs => tabs.tabContents().map(content => content.textContent));
    async function tabs(page) {
        const root = await mount(page, TABS);
        const el = root.locator('#s');
        await el.evaluate(tabs => { window.__orders = []; tabs.addEventListener('reorder', ev => window.__orders.push(ev.detail.order.map(b => b.dataset.id))); });
        return el;
    }

    test('a tab let go over another tab takes its place, either way, from the middle of one to the middle of the other', async ({ page }) => {
        const el = await tabs(page);
        // Dragged as a person does: pressed in a tab's middle, let go in the middle of the tab where it should go.
        const drag = async (from, to) => {
            const a = await el.locator(`[data-id="${from}"]`).boundingBox();
            const b = await el.locator(`[data-id="${to}"]`).boundingBox();
            await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
            await page.mouse.down();
            await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 });
            await page.mouse.up();
        };
        await drag('a', 'c');
        await expect.poll(() => order(el)).toEqual(['b', 'c', 'a']);
        await drag('a', 'b');
        await expect.poll(() => order(el)).toEqual(['a', 'b', 'c']);
        await drag('b', 'a');
        await expect.poll(() => order(el)).toEqual(['b', 'a', 'c']);
        await drag('c', 'a');
        await expect.poll(() => order(el)).toEqual(['b', 'c', 'a']);
    });

    test('dragging a tab moves it and its content, keeps the shown tab shown, and says so', async ({ page }) => {
        const el = await tabs(page);
        await el.locator('[data-id="b"]').click();
        await expect(el.locator('div[slot="content"]', { hasText: 'Content B' })).toBeVisible();
        const from = await el.locator('[data-id="a"]').boundingBox();
        const to = await el.locator('[data-id="c"]').boundingBox();
        await page.mouse.move(from.x + 5, from.y + from.height / 2);
        await page.mouse.down();
        await page.mouse.move(from.x + 15, from.y + from.height / 2, { steps: 3 });
        await page.mouse.move(to.x + to.width - 3, to.y + to.height / 2, { steps: 6 });
        await page.mouse.up();
        await expect.poll(() => order(el)).toEqual(['b', 'c', 'a']);
        await expect.poll(() => contents(el)).toEqual(['Content B', 'Content C', 'Content A']);
        // B was shown, and stays shown; the click ending the drag did not open A.
        await expect(el.locator('div[slot="content"]', { hasText: 'Content B' })).toBeVisible();
        await expect.poll(() => page.evaluate(() => window.__orders.at(-1))).toEqual(['b', 'c', 'a']);
        // Each tab still opens its own content where it is now.
        await el.locator('[data-id="a"]').click();
        await expect(el.locator('div[slot="content"]', { hasText: 'Content A' })).toBeVisible();
    });

    test('Alt+Left and Alt+Right move the focused tab, keeping its focus', async ({ page }) => {
        const el = await tabs(page);
        const a = el.locator('[data-id="a"]');
        await a.focus();
        await page.keyboard.press('Alt+ArrowRight');
        await expect.poll(() => order(el)).toEqual(['b', 'a', 'c']);
        await expect(a).toBeFocused();
        await page.keyboard.press('Alt+ArrowLeft');
        await expect.poll(() => order(el)).toEqual(['a', 'b', 'c']);
        await page.keyboard.press('Alt+ArrowLeft');
        await expect.poll(() => page.evaluate(() => window.__orders.length)).toBe(2);
    });

    test('without sortable, tabs stay where they are', async ({ page }) => {
        const root = await mount(page, TABS.replace(' sortable', ''));
        const el = root.locator('#s');
        await el.locator('[data-id="a"]').focus();
        await page.keyboard.press('Alt+ArrowRight');
        await el.locator('[data-id="c"]').click();
        await expect.poll(() => order(el)).toEqual(['a', 'b', 'c']);
    });
});
