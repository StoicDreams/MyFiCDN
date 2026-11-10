import { test, expect, mount } from '../support/webui.mjs';

// These run on the real site shell, since routing needs webui-app.
test.use({ startUrl: '/about' });

test('webui.navigateTo loads a page without a full reload', async ({ page }) => {
    await page.evaluate(() => { window.__sameDocument = true; webui.navigateTo('/contact'); });
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.locator('webui-app')).toContainText('feedback form');
    expect(await page.evaluate(() => window.__sameDocument)).toBe(true);
});
test('webui.navigateTo to the current url adds no history entry', async ({ page }) => {
    const before = await page.evaluate(() => history.length);
    await page.evaluate(() => webui.navigateTo('/about'));
    expect(await page.evaluate(() => history.length)).toBe(before);
});
test('back and forward keep history intact', async ({ page }) => {
    await page.evaluate(() => webui.navigateTo('/contact'));
    await expect(page.locator('webui-app')).toContainText('feedback form');
    await page.evaluate(() => webui.navigateTo('/privacy'));
    await expect(page).toHaveURL(/\/privacy$/);
    const length = await page.evaluate(() => history.length);
    await page.goBack();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.locator('webui-app')).toContainText('feedback form');
    expect(await page.evaluate(() => history.length)).toBe(length);
    await page.goForward();
    await expect(page).toHaveURL(/\/privacy$/);
});
test('webui.updateHash keeps the query string and can replace history', async ({ page }) => {
    await page.evaluate(() => history.replaceState(null, '', '/about?x=1'));
    await page.evaluate(() => webui.updateHash('one'));
    await expect(page).toHaveURL(/\/about\?x=1#one$/);
    const length = await page.evaluate(() => history.length);
    await page.evaluate(() => webui.updateHash('two', true));
    await expect(page).toHaveURL(/#two$/);
    expect(await page.evaluate(() => history.length)).toBe(length);
});
test('a slow page cannot replace a newer one', async ({ page }) => {
    await page.route('**/d/privacy.md', async route => {
        await new Promise(r => setTimeout(r, 900));
        await route.fallback();
    });
    const loaded = await page.evaluate(async () => {
        const app = webui._appSettings.app;
        const original = app.setPageContent;
        const urls = [];
        app.setPageContent = function (content, data, url) {
            if (content) urls.push(url);
            return original.call(this, content, data, url);
        };
        webui.navigateTo('/privacy');
        await webui.wait(30);
        webui.navigateTo('/contact');
        await webui.wait(1500);
        return urls;
    });
    expect(loaded).toEqual(['/d/contact.md']);
});
test('a missing page shows the not found content', async ({ page }) => {
    await page.evaluate(() => webui.navigateTo('/does-not-exist'));
    await expect(page.locator('webui-page-not-found')).toContainText('custom 404 content');
    await expect(page).toHaveTitle(/Page Not Found/);
});
test('internal links route without a reload', async ({ page }) => {
    const root = await mount(page, '<a href="/contact" style="position:fixed;top:0;left:50%;z-index:9999">go</a>');
    await page.evaluate(() => { window.__sameDocument = true; });
    await root.locator('a').click();
    await expect(page).toHaveURL(/\/contact$/);
    expect(await page.evaluate(() => window.__sameDocument)).toBe(true);
});
test('links with a target, modifier keys, or another scheme are left to the browser', async ({ page }) => {
    const root = await mount(page, '<a id="t" href="/contact" target="_blank"></a><a id="k" href="/contact"></a><a id="m" href="mailto:a@b.c"></a>');
    const prevented = await root.evaluate(r => {
        const results = [];
        const record = ev => { results.push(ev.defaultPrevented); ev.preventDefault(); };
        window.addEventListener('click', record);
        r.querySelector('#t').click();
        r.querySelector('#k').dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true, ctrlKey: true }));
        r.querySelector('#m').click();
        window.removeEventListener('click', record);
        return results;
    });
    expect(prevented).toEqual([false, false, false]);
    await expect(page).toHaveURL(/\/about$/);
});
test('data-click clicks elements subscribed with :click', async ({ page }) => {
    const root = await mount(page, '<a id="c" data-click="nav-fb">x</a><button id="s" data-subscribe="nav-fb:click">y</button>');
    expect(await root.evaluate(async r => {
        let clicks = 0;
        await webui.wait(20);
        r.querySelector('#s').addEventListener('click', () => clicks++);
        r.querySelector('#c').click();
        return clicks;
    })).toBe(1);
});
test('data-toggleclass, data-setattr, data-toggleattr, and data-removeclass update elements', async ({ page }) => {
    const root = await mount(page, `<i id="target" class="on"></i>
<button id="a" data-toggleclass="#target|flip"></button>
<button id="b" data-setattr="#target|data-x|1"></button>
<button id="c" data-toggleattr="#target|flag"></button>
<button id="d" data-removeclass="#target|on"></button>`);
    const target = root.locator('#target');
    const click = id => root.locator(id).evaluate(el => el.click());
    await click('#a');
    await expect(target).toHaveClass('on flip');
    await click('#b');
    await expect(target).toHaveAttribute('data-x', '1');
    await click('#c');
    await expect(target).toHaveAttribute('flag', 'true');
    await click('#c');
    await expect(target).not.toHaveAttribute('flag');
    await click('#d');
    await expect(target).toHaveClass('flip');
});
test('dynamic styles only refresh when a click changed something', async ({ page }) => {
    const root = await mount(page, '<button id="a" data-toggleclass="x"></button><button id="b" data-setattr="data-y|1"></button><div data-removeclass=".none-here|open"><button id="c"></button></div>');
    expect(await root.evaluate(r => {
        let calls = 0;
        const original = webui.applyDynamicStyles;
        webui.applyDynamicStyles = () => { calls++; };
        r.querySelector('#a').click();
        r.querySelector('#b').click();
        const afterChanges = calls;
        r.querySelector('#c').click();
        webui.applyDynamicStyles = original;
        return [afterChanges, calls];
    })).toEqual([2, 2]);
});
test('disabled elements stop click handling', async ({ page }) => {
    const root = await mount(page, '<button disabled data-toggleclass="x" id="a"></button><div disabled="true" id="b" data-toggleclass="x"></div>');
    await root.locator('#b').evaluate(el => el.click());
    await expect(root.locator('#b')).not.toHaveClass('x');
});
test('tooltips show aria-labels and titles on hover', async ({ page }) => {
    const root = await mount(page, '<button title="Helpful" style="position:fixed;top:300px;left:300px;z-index:9999">x</button>');
    await root.locator('button').hover();
    await expect(page.locator('body > .tooltip')).toHaveText('Helpful');
    await expect(page.locator('body > .tooltip')).toHaveClass(/open/);
    await expect(root.locator('button')).toHaveAttribute('aria-label', 'Helpful');
    // The button already has the label, so screen readers do not also hear the tooltip.
    await expect(page.locator('body > .tooltip')).toHaveAttribute('aria-hidden', 'true');
});
test('a tooltip never blocks clicks, and closes when its element is hidden under a still pointer', async ({ page }) => {
    const root = await mount(page, '<button id="hide" title="Hides itself" style="position:fixed;top:300px;left:300px;z-index:9999">x</button><button id="below" style="position:fixed;top:250px;left:250px;width:200px;height:60px">Below</button>');
    await root.locator('#hide').hover();
    const tooltip = page.locator('body > .tooltip');
    await expect(tooltip).toHaveClass(/open/);
    expect(await tooltip.evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none');
    // Hiding it without moving the mouse, as a closing panel does to its close button.
    await root.locator('#hide').evaluate(el => { el.style.display = 'none'; });
    await expect(tooltip).toHaveClass(/closed/);
});
test('a tooltip shows above an open dropdown list', async ({ page }) => {
    const options = JSON.stringify(['One', 'Two', 'Three', 'Four'].map(name => ({ value: name, html: `<span title="About ${name}">${name}</span>` })));
    const root = await mount(page, `<webui-dropdown html-options options='${options}' style="position:fixed;top:100px;left:100px;width:200px"></webui-dropdown>`);
    const dropdown = root.locator('webui-dropdown');
    await dropdown.locator('button').click();
    await dropdown.getByRole('option', { name: 'Three' }).locator('span').hover();
    const tooltip = page.locator('body > .tooltip');
    await expect(tooltip).toHaveText('About Three');
    await expect(tooltip).toHaveClass(/open/);
    // The list is in the top layer, so the tooltip is only seen if it is above it there.
    const onTop = await tooltip.evaluate(el => {
        const box = el.getBoundingClientRect();
        el.style.pointerEvents = 'auto';
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        el.style.pointerEvents = '';
        return hit === el;
    });
    expect(onTop).toBe(true);
    await expect(dropdown.getByRole('listbox')).toBeVisible();
});
test('a tab named in the url opens on load', async ({ page }) => {
    await page.goto('/#condition');
    const tabs = page.locator('webui-tabs').first();
    const button = tabs.locator(':scope > [hash="condition"]');
    await expect(button).toHaveAttribute('theme', 'active');
    await expect(page).toHaveURL(/#condition$/);
    await expect(tabs.locator('webui-condition').first()).toBeAttached({ timeout: 10000 });
});
test('a tab named in the url wins over the saved tab', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('webui-tabs > [hash="welcome"]')).toHaveAttribute('theme', 'active');
    await page.locator('webui-tabs > [hash="quote"]').evaluate(el => el.click());
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem('session-data'))).toContain('home-tab-index');
    await page.goto('/about');
    await page.goto('/#markdown');
    await expect(page.locator('webui-tabs > [hash="markdown"]')).toHaveAttribute('theme', 'active');
    await expect(page).toHaveURL(/#markdown$/);
});

// The first page has nothing to fade out, so it shows once its components are ready rather than after the fade.
test.describe('first page load', () => {
    test.use({ startUrl: '/__blank' });
    /**
     * Serve the page with the given content, and return how long after it arrived the page showed.
     * With holdFade, timers of 250 ms or more never run, so the page can only show if it does not wait for the fade.
     */
    async function shownAfter(page, markdown, { holdFade = false } = {}) {
        await page.route('**/d/about.md', route => route.fulfill({ contentType: 'text/plain', body: markdown }));
        await page.addInitScript(holdFade => {
            if (holdFade) {
                const setTimeoutReal = window.setTimeout;
                window.setTimeout = function (callback, ms, ...args) {
                    return ms >= 250 ? setTimeoutReal(() => { }, 0) : setTimeoutReal(callback, ms, ...args);
                };
            }
            window.__shown = null;
            const watch = () => {
                const main = document.querySelector('webui-app')?.main;
                if (!main) return requestAnimationFrame(watch);
                new MutationObserver(() => {
                    if (main.classList.contains('transition') || window.__shown) return;
                    window.__shown = performance.now();
                    window.__undefinedWhenShown = document.querySelectorAll('webui-app :not(:defined)').length;
                }).observe(main, { attributes: true, attributeFilter: ['class'] });
            };
            watch();
        }, holdFade);
        await page.goto('/about');
        await expect.poll(() => page.evaluate(() => window.__shown), { timeout: 5000 }).not.toBeNull();
        return page.evaluate(() => window.__shown - performance.getEntriesByType('resource').find(e => /\/d\/about\.md/.test(e.name)).responseEnd);
    }
    test('shows a page without components straight away', async ({ page }) => {
        // Later navigations wait 300 ms for the fade. The first page shows without that timer, so it shows even when
        // long timers never run. Timing it instead failed on busy machines, where a frame alone can take over 150 ms.
        await shownAfter(page, '# Quick\n\nNothing to load here.', { holdFade: true });
    });
    test('waits for the page components, but not forever', async ({ page }) => {
        // A component that never loads still lets the page show, after at most the fade time.
        await page.route('**/webui/never-loads.min.js', () => { });
        const gap = await shownAfter(page, '# Slow\n\n<webui-never-loads></webui-never-loads>');
        expect(gap).toBeGreaterThanOrEqual(290);
        // Generous, since a busy test machine can be slow. Without the cap it would never show.
        expect(gap).toBeLessThan(1500);
    });
});
test('navigating fades the old page out before showing the new one', async ({ page }) => {
    const main = page.locator('webui-app main');
    await expect(main).not.toHaveClass(/transition/);
    const start = await page.evaluate(() => { webui.navigateTo('/contact'); return performance.now(); });
    await expect(main).toHaveClass(/transition/);
    await expect(main).not.toHaveClass(/transition/);
    expect(await page.evaluate(s => performance.now() - s, start)).toBeGreaterThanOrEqual(300);
});
