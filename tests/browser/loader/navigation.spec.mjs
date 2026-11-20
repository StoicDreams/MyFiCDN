import { test, expect, mount } from '../support/webui.mjs';

/**
 * Move the mouse, and wait until the tooltip has decided what to show for that move.
 * The tooltip decides in the animation frame after a mouse move. This listener is added after the tooltip's own, so
 * it runs after it, and the frame it asks for comes after the one the tooltip asked for.
 */
async function moveMouse(page, x, y) {
    await page.evaluate(() => {
        window.__moveHandled = new Promise(resolve => {
            document.body.addEventListener('mousemove', () => requestAnimationFrame(() => resolve()), { once: true });
        });
    });
    await page.mouse.move(x, y);
    await page.evaluate(() => window.__moveHandled);
}

// These run on the real site shell, since routing needs webui-app.
test.use({ startUrl: '/about' });

test('webui.navigateTo loads a page without a full reload', async ({ page }) => {
    await page.evaluate(() => { window.__sameDocument = true; webui.navigateTo('/contact'); });
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.locator('webui-app')).toContainText('feedback form');
    expect(await page.evaluate(() => window.__sameDocument)).toBe(true);
});
test('webui.navigateTo to the current url adds no history entry', async ({ page }) => {
    // The history entry is added, or not, before navigateTo returns.
    const [before, after] = await page.evaluate(() => {
        const before = history.length;
        webui.navigateTo('/about');
        return [before, history.length];
    });
    expect(after).toBe(before);
    // The next navigation adds exactly one entry, so the first added none later either.
    await page.evaluate(() => webui.navigateTo('/contact'));
    await expect(page.locator('webui-app')).toContainText('feedback form');
    await expect.poll(() => page.evaluate(() => history.length)).toBe(before + 1);
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
    await expect.poll(() => page.evaluate(() => history.length)).toBe(length);
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
    await expect.poll(() => page.evaluate(() => history.length)).toBe(length);
});
test('a slow page cannot replace a newer one', async ({ page }) => {
    // The slow page is held until the newer one is showing, then let go.
    let requested, release;
    const wasRequested = new Promise(resolve => { requested = resolve; });
    const released = new Promise(resolve => { release = resolve; });
    await page.route('**/d/privacy.md', async route => {
        requested();
        await released;
        await route.fallback();
    });
    await page.evaluate(() => {
        const app = webui._appSettings.app;
        const original = app.setPageContent;
        window.__pagesSet = [];
        app.setPageContent = function (content, data, url) {
            if (content) window.__pagesSet.push(url);
            return original.call(this, content, data, url);
        };
        webui.navigateTo('/privacy');
    });
    await wasRequested;
    await page.evaluate(() => webui.navigateTo('/contact'));
    const main = page.locator('webui-app main');
    await expect(page.locator('webui-app')).toContainText('feedback form');
    await expect(main).not.toHaveClass(/transition/);
    release();
    // A third page loads after the slow one was let go, so by the time it shows the slow one has had its chance.
    await page.evaluate(() => webui.navigateTo('/terms'));
    await expect(page).toHaveURL(/\/terms$/);
    await expect.poll(() => page.evaluate(() => window.__pagesSet)).toEqual(['/d/contact.md', '/d/terms.md']);
    await expect(main).not.toHaveClass(/transition/);
    expect(await page.evaluate(() => window.__pagesSet)).toEqual(['/d/contact.md', '/d/terms.md']);
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
test('a #part link stays on the current page and scrolls to its target', async ({ page }) => {
    const root = await mount(page, `<a href="#far" style="position:fixed;top:0;left:50%;z-index:9999">jump</a>
<div style="height:3000px"></div><h2 id="far" hash="far">Far heading</h2><div style="height:3000px"></div>`);
    await page.evaluate(() => { window.__sameDocument = true; });
    const heading = root.locator('#far');
    await root.locator('a').click();
    await expect(page).toHaveURL(/\/about#far$/);
    await expect(heading).toBeInViewport();
    expect(await page.evaluate(() => window.__sameDocument)).toBe(true);
    // Scrolling away and clicking the same link again scrolls back.
    await heading.evaluate(el => el.previousElementSibling.scrollIntoView());
    await expect(heading).not.toBeInViewport();
    await root.locator('a').click();
    await expect(heading).toBeInViewport();
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
    await root.evaluate(r => {
        window.__clicks = 0;
        r.querySelector('#s').addEventListener('click', () => window.__clicks++);
        r.querySelector('#c').click();
    });
    await expect.poll(() => page.evaluate(() => window.__clicks)).toBe(1);
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
    const root = await mount(page, '<button disabled data-toggleclass="x" id="a"></button><div disabled="true" id="b" data-toggleclass="x"></div><div id="c" data-toggleclass="x"></div>');
    await root.locator('#b').evaluate(el => el.click());
    // A click on an element that is not disabled, made afterwards, shows the first click has been handled.
    await root.locator('#c').evaluate(el => el.click());
    await expect(root.locator('#c')).toHaveClass('x');
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
test('a landmark label such as the nav\'s Site menu is not shown as a tooltip, but a title on a region is', async ({ page }) => {
    const root = await mount(page, `<div role="navigation" aria-label="Site menu" style="position:fixed;top:200px;left:200px;width:300px;padding:20px;z-index:9999">
<a id="text" href="#a" aria-label="Home">Home</a><br><br><a id="icon" href="#b" aria-label="Settings">⚙</a></div>
<section id="titled" title="Region help" style="position:fixed;top:500px;left:200px;width:200px;height:40px">Region</section>`);
    const tooltip = page.locator('body > .tooltip');
    // Moving between the links and the space around them, as a mouse does over the nav.
    for (const [x, y] of [[210, 210], [400, 230], [210, 210]]) {
        await moveMouse(page, x, y);
        await expect(tooltip).toHaveClass(/closed/);
        await expect(tooltip).not.toHaveText('Site menu');
    }
    await root.locator('#text').hover();
    await expect(tooltip).toHaveClass(/closed/);
    await root.locator('#icon').hover();
    await expect(tooltip).toHaveText('Settings');
    await page.mouse.move(450, 300);
    await expect(tooltip).toHaveClass(/closed/);
    await root.locator('#titled').hover({ position: { x: 150, y: 20 } });
    await expect(tooltip).toHaveText('Region help');
    await page.mouse.move(5, 5);
    await root.locator('#titled').hover({ position: { x: 160, y: 25 } });
    await expect(tooltip).toHaveText('Region help');
});
test('a tooltip never blocks clicks, and closes when its element is hidden under a still pointer', async ({ page }) => {
    const root = await mount(page, '<button id="hide" title="Hides itself" style="position:fixed;top:300px;left:300px;z-index:9999">x</button><button id="below" style="position:fixed;top:250px;left:250px;width:200px;height:60px">Below</button>');
    await root.locator('#hide').hover();
    const tooltip = page.locator('body > .tooltip');
    await expect(tooltip).toHaveClass(/open/);
    // A click where the tooltip is reaches the page beneath it. Its place is only used to aim the click.
    await page.evaluate(() => { window.__clickedOn = null; document.addEventListener('click', ev => { window.__clickedOn = ev.target.className; }, { once: true }); });
    const tip = await tooltip.boundingBox();
    await page.mouse.click(tip.x + tip.width / 2, tip.y + tip.height / 2);
    await expect.poll(() => page.evaluate(() => window.__clickedOn)).not.toBeNull();
    expect(await page.evaluate(() => window.__clickedOn)).not.toContain('tooltip');
    // Hiding it without moving the mouse, as a closing panel does to its close button.
    await root.locator('#hide').evaluate(el => { el.style.display = 'none'; });
    await expect(tooltip).toHaveClass(/closed/);
});
test.describe('on a touch screen', () => {
    test.use({ hasTouch: true, isMobile: true });
    /** Taps, and waits until the tooltip has decided what to show for the mouse move the tap sends. */
    async function tap(page, locator) {
        await page.evaluate(() => {
            window.__moveHandled = new Promise(resolve => {
                document.body.addEventListener('mousemove', () => requestAnimationFrame(() => resolve()), { once: true });
            });
        });
        await locator.tap();
        await page.evaluate(() => window.__moveHandled);
    }
    test('tapping a button or link does its job without showing its tooltip', async ({ page }) => {
        const root = await mount(page, `<button id="menu" aria-label="open navigation menu" style="position:fixed;top:300px;left:100px;z-index:9999">☰</button>
<a id="home" href="#home" title="Home" style="position:fixed;top:400px;left:100px;z-index:9999"><webui-icon icon="home"></webui-icon></a>`);
        const tooltip = page.locator('body > .tooltip');
        await page.evaluate(() => { window.__taps = 0; document.querySelector('#menu').addEventListener('click', () => window.__taps++); });
        await tap(page, root.locator('#menu'));
        await expect.poll(() => page.evaluate(() => window.__taps)).toBe(1);
        await expect(tooltip).toHaveClass(/closed/);
        await tap(page, root.locator('#home webui-icon'));
        await expect(page).toHaveURL(/#home$/);
        await expect(tooltip).toHaveClass(/closed/);
    });
    test('tapping something that is only there to give information shows its tooltip', async ({ page }) => {
        const root = await mount(page, '<button id="menu" aria-label="Menu" style="position:fixed;top:300px;left:100px;z-index:9999">☰</button><span id="info" tabindex="0" title="Saved every minute" style="position:fixed;top:400px;left:100px;z-index:9999">i</span>');
        const tooltip = page.locator('body > .tooltip');
        await tap(page, root.locator('#info'));
        await expect(tooltip).toHaveText('Saved every minute');
        await expect(tooltip).toHaveClass(/open/);
        // A control tapped next closes it, and shows no tooltip of its own.
        await tap(page, root.locator('#menu'));
        await expect(tooltip).toHaveClass(/closed/);
        await expect(tooltip).toHaveText('Saved every minute');
    });
});
test('a mouse move handled after its element was hidden shows no tooltip', async ({ page }) => {
    const root = await mount(page, '<button id="gone" title="Rename" style="position:fixed;top:300px;left:300px;z-index:9999">x</button>');
    const tooltip = page.locator('body > .tooltip');
    // A move, then the element hidden before the tooltip's frame, as a click that hides its button does.
    await root.locator('#gone').evaluate(el => new Promise(resolve => {
        el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, composed: true }));
        el.style.display = 'none';
        requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));
    await expect(tooltip).toHaveClass(/closed/);
    await expect(tooltip).not.toHaveText('Rename');
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
// A small page of tabs, set up like the home page's, so these check how tabs read the url without waiting on the
// heaviest page of the site, which on a busy machine can take longer to load than a check waits.
const TABS_PAGE = `<webui-tabs vertical data-subscribe="session-tabs-page-index:setTab">
    <webui-button align="left" hash="welcome" slot="tabs">Welcome</webui-button>
    <webui-page-segment slot="content">Welcome content</webui-page-segment>
    <webui-button align="left" hash="markdown" slot="tabs">Markdown</webui-button>
    <webui-page-segment slot="content">Markdown content</webui-page-segment>
    <webui-button align="left" hash="condition" slot="tabs">Condition</webui-button>
    <webui-page-segment slot="content"><webui-condition data-subscribe="tabs-page-flag"></webui-condition></webui-page-segment>
    <webui-button align="left" hash="quote" slot="tabs">Quote</webui-button>
    <webui-page-segment slot="content">Quote content</webui-page-segment>
</webui-tabs>`;
const serveTabsPage = page => page.route('**/d/tabs.md', route => route.fulfill({ contentType: 'text/plain', body: TABS_PAGE }));
test('a tab named in the url opens on load', async ({ page }) => {
    await serveTabsPage(page);
    await page.goto('/tabs#condition', { waitUntil: 'commit' });
    const tabs = page.locator('webui-tabs').first();
    const button = tabs.locator(':scope > [hash="condition"]');
    await expect(button).toHaveAttribute('theme', 'active');
    await expect(page).toHaveURL(/#condition$/);
    await expect(tabs.locator('webui-condition').first()).toBeAttached();
});
test('a tab named in the url wins over the saved tab', async ({ page }) => {
    await serveTabsPage(page);
    await page.goto('/tabs', { waitUntil: 'commit' });
    await expect(page.locator('webui-tabs > [hash="welcome"]')).toHaveAttribute('theme', 'active');
    await page.locator('webui-tabs > [hash="quote"]').evaluate(el => el.click());
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem('session-data'))).toContain('tabs-page-index');
    // Another page between them, so the url's tab is read on a fresh load rather than as a hash change.
    await page.goto('/about', { waitUntil: 'commit' });
    await page.goto('/tabs#markdown', { waitUntil: 'commit' });
    await expect(page.locator('webui-tabs > [hash="markdown"]')).toHaveAttribute('theme', 'active');
    await expect(page).toHaveURL(/#markdown$/);
});

// The first page has nothing to fade out, so it shows once its components are ready rather than after the fade.
test.describe('first page load', () => {
    test.use({ startUrl: '/__blank' });
    /**
     * Serve the page with the given content, and open it with every timer of 250 ms or more held, the fade's among
     * them. A held timer only runs when the test runs it, so the page can only show before then if it does not
     * wait for the fade.
     */
    async function openWithFadeHeld(page, markdown) {
        await page.route('**/d/about.md', route => route.fulfill({ contentType: 'text/plain', body: markdown }));
        await page.addInitScript(() => {
            const setTimeoutReal = window.setTimeout;
            window.__heldTimers = [];
            window.setTimeout = function (callback, ms, ...args) {
                if (ms >= 250) {
                    window.__heldTimers.push({ ms, run: () => callback(...args) });
                    return setTimeoutReal(() => { }, 0);
                }
                return setTimeoutReal(callback, ms, ...args);
            };
            window.__shown = false;
            const watch = () => {
                const main = document.querySelector('webui-app')?.main;
                if (!main) return requestAnimationFrame(watch);
                new MutationObserver(() => {
                    if (!main.classList.contains('transition')) window.__shown = true;
                }).observe(main, { attributes: true, attributeFilter: ['class'] });
            };
            watch();
        });
        await page.goto('/about');
    }
    // Shown once the page has dropped the fade's class. The observer catches any moment it did, and the page's own
    // text with no fade running covers a page that showed before the observer could be attached to it.
    const shown = (page, text) => page.evaluate(text => {
        const main = document.querySelector('webui-app')?.main;
        return window.__shown || (!!main?.textContent.includes(text) && !main.classList.contains('transition'));
    }, text);
    test('shows a page without components straight away', async ({ page }) => {
        // Later navigations wait 300 ms for the fade. The first page shows without that timer, so it shows even when
        // long timers never run. Timing it instead failed on busy machines, where a frame alone can take over 150 ms.
        await openWithFadeHeld(page, '# Quick\n\nNothing to load here.');
        await expect.poll(() => shown(page, 'Nothing to load here.')).toBe(true);
    });
    test('waits for the page components, but not forever', async ({ page }) => {
        await page.route('**/webui/never-loads.min.js', () => { });
        await openWithFadeHeld(page, '# Slow\n\n<webui-never-loads></webui-never-loads>');
        // The page is in place and the loader has started the wait that ends with the first of the component
        // loading and the fade time passing. Its timer is the only one of 300 ms on a first load.
        await expect(page.locator('webui-app webui-never-loads')).toBeAttached();
        await expect.poll(() => page.evaluate(() => window.__heldTimers.some(timer => timer.ms === 300))).toBe(true);
        // A page that did not wait for its component would show in the next frame.
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
        expect(await shown(page, 'Slow')).toBe(false);
        // A component that never loads still lets the page show, once the fade time has passed.
        // Running a held timer twice is not possible, and a timer held later is run by a later try, so repeating
        // this only moves time on.
        await expect.poll(() => page.evaluate(() => {
            window.__heldTimers.splice(0).forEach(timer => timer.run());
            return window.__shown;
        })).toBe(true);
    });
});
test('navigating fades the old page out before showing the new one', async ({ page }) => {
    const main = page.locator('webui-app main');
    const app = page.locator('webui-app');
    await expect(main).not.toHaveClass(/transition/);
    // The test moves the clock, so the 300 ms fade is checked without waiting for, or measuring, real time.
    await page.clock.install();
    await page.clock.pauseAt(Date.now() + 60 * 60 * 1000);
    await page.evaluate(() => {
        // Resolves once the loader has read the new page's content, and so has started waiting out the fade.
        // This reaction is added before the loader's own, so the microtask it queues runs after the loader's.
        const readText = Response.prototype.text;
        window.__contentRead = new Promise(resolve => {
            Response.prototype.text = function () {
                const body = readText.call(this);
                if (new URL(this.url).pathname === '/d/contact.md') body.then(() => queueMicrotask(resolve));
                return body;
            };
        });
        webui.navigateTo('/contact');
    });
    await expect(main).toHaveClass(/transition/);
    await page.evaluate(() => window.__contentRead);
    // One millisecond short of the fade, the old page is still there, faded out.
    await page.clock.runFor(299);
    await expect(main).toHaveClass(/transition/);
    await expect(app).not.toContainText('feedback form');
    await page.clock.runFor(1);
    await expect(app).toContainText('feedback form');
    await page.clock.resume();
    await expect(main).not.toHaveClass(/transition/);
});
test.describe('a new page starts at the top', () => {
    // Makes the current page tall enough to scroll, and scrolls it down.
    const scrollDown = page => page.evaluate(() => {
        const tall = document.createElement('div');
        tall.style.height = '5000px';
        document.querySelector('webui-app').append(tall);
        const main = document.querySelector('webui-app').main;
        main.scrollTop = 2000;
        return main.scrollTop;
    });
    // The about page has loaded and finished fading in, so nothing replaces the added content afterwards.
    const aboutShown = async page => {
        await expect(page.locator('webui-app')).toContainText('More information coming soon');
        await expect(page.locator('webui-app main')).not.toHaveClass(/transition/);
    };
    const mainScroll = page => page.evaluate(() => document.querySelector('webui-app').main.scrollTop);

    test('navigating scrolls the page back to the top over 200 ms', async ({ page }) => {
        await aboutShown(page);
        // The test moves the clock, so the 200 ms scroll is checked without waiting for real time.
        await page.clock.install();
        await page.clock.pauseAt(Date.now() + 60 * 60 * 1000);
        expect(await scrollDown(page)).toBeGreaterThan(0);
        await page.evaluate(() => webui.navigateTo('/contact'));
        // Partway through, it is moving up but not there yet: it animates rather than jumping.
        await page.clock.runFor(100);
        const halfway = await mainScroll(page);
        expect(halfway).toBeGreaterThan(0);
        expect(halfway).toBeLessThan(2000);
        await page.clock.runFor(150);
        expect(await mainScroll(page)).toBe(0);
        await page.clock.resume();
        await expect(page.locator('webui-app')).toContainText('feedback form');
        expect(await mainScroll(page)).toBe(0);
    });
    test('with reduced motion, navigating jumps straight to the top', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await aboutShown(page);
        expect(await scrollDown(page)).toBeGreaterThan(0);
        await page.evaluate(() => webui.navigateTo('/contact'));
        // The jump happens as navigateTo runs, before the new page has loaded.
        expect(await mainScroll(page)).toBe(0);
        await expect(page.locator('webui-app')).toContainText('feedback form');
    });
    test('a #part link on the same page keeps its place', async ({ page }) => {
        await aboutShown(page);
        await scrollDown(page);
        await page.evaluate(() => webui.updateHash('nothing-here'));
        await expect(page).toHaveURL(/#nothing-here$/);
        // A second change goes through the same path; once it is handled, the scroll is still where it was.
        await page.evaluate(() => webui.updateHash('still-nothing'));
        await expect(page).toHaveURL(/#still-nothing$/);
        expect(await mainScroll(page)).toBe(2000);
    });
});
