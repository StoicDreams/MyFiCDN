import { test, expect, mount } from '../support/webui.mjs';

test('webui.create builds an element with attributes, content, and events', async ({ page }) => {
    expect(await page.evaluate(() => {
        let clicks = 0;
        const el = webui.create('button', { id: 'a', text: 'Go', click: () => clicks++ });
        el.click();
        return [el.nodeName, el.id, el.innerText, clicks, webui.create('div', { html: '<b>x</b>' }).innerHTML];
    })).toEqual(['BUTTON', 'a', 'Go', 1, '<b>x</b>']);
});
test('webui.createFromHTML returns the first node', async ({ page }) => {
    expect(await page.evaluate(() => {
        const el = webui.createFromHTML('<p>x</p>', { class: 'y' });
        return [el.outerHTML, webui.createFromHTML('') === undefined];
    })).toEqual(['<p class="y">x</p>', true]);
});
test('webui.attachAttributes applies attributes to an element', async ({ page }) => {
    expect(await page.evaluate(() => webui.attachAttributes(document.createElement('div'), { title: 't', innerHTML: 'h' }).outerHTML)).toBe('<div title="t">h</div>');
});
test('webui.closest walks up through shadow roots', async ({ page }) => {
    expect(await page.evaluate(() => {
        const host = document.createElement('section');
        document.body.appendChild(host);
        const inner = document.createElement('i');
        host.attachShadow({ mode: 'open' }).appendChild(inner);
        return [webui.closest(inner, 'section') === host, webui.closest(inner, 'nav'), webui.closest(null, 'nav')];
    })).toEqual([true, null, null]);
});
test('webui.closest accepts events', async ({ page }) => {
    expect(await page.evaluate(() => {
        let found;
        document.body.addEventListener('click', ev => { found = webui.closest(ev, 'body') === document.body; }, { once: true });
        document.body.click();
        return found;
    })).toBe(true);
});
test('webui.querySelector and webui.querySelectorAll search shadow roots', async ({ page }) => {
    await mount(page, '<webui-alert id="a" show>x</webui-alert><p class="light">y</p>');
    expect(await page.evaluate(async () => {
        await new Promise(r => setTimeout(r, 50));
        return [
            webui.querySelector('p.light').nodeName,
            webui.querySelector('#close').nodeName,
            webui.querySelectorAll('#close').length,
            webui.querySelector('.missing') === undefined,
        ];
    })).toEqual(['P', 'BUTTON', 1, true]);
});
test('webui.getHtmlFromTemplate renders assigned templates', async ({ page }) => {
    expect(await page.evaluate(() => webui.getHtmlFromTemplate({ assignedElements: () => [{ innerHTML: '**{X}**' }] }, { x: 'a' }))).toContain('<strong>a</strong>');
    expect(await page.evaluate(() => webui.getHtmlFromTemplate(null))).toBe('');
});
test('webui.hasSetter finds setters on the prototype chain', async ({ page }) => {
    expect(await page.evaluate(() => [webui.hasSetter(document.createElement('input'), 'value'), webui.hasSetter(document.createElement('div'), 'value'), webui.hasSetter(null, 'x')])).toEqual([true, false, false]);
});
test('webui.isTextOverflowing compares scroll and client width', async ({ page }) => {
    expect(await page.evaluate(() => [webui.isTextOverflowing({ scrollWidth: 20, clientWidth: 10 }), webui.isTextOverflowing({ scrollWidth: 11, clientWidth: 10 })])).toEqual([true, false]);
});
test('webui.removeFromParentPTag lifts an element out of a paragraph', async ({ page }) => {
    expect(await page.evaluate(() => {
        const d = document.createElement('div');
        d.innerHTML = '<p><span></span></p>';
        webui.removeFromParentPTag(d.querySelector('span'));
        return d.innerHTML;
    })).toBe('<span></span>');
});
test('webui.removeChildren removes all or matching children', async ({ page }) => {
    expect(await page.evaluate(() => {
        const d = document.createElement('div');
        d.innerHTML = '<a></a><b></b>';
        const removed = webui.removeChildren(d, n => n.nodeName === 'A');
        const first = [removed.length, d.innerHTML];
        webui.removeChildren(d);
        return [...first, d.innerHTML];
    })).toEqual([1, '<b></b>', '']);
});
test('webui.removeClass removes classes by prefix', async ({ page }) => {
    expect(await page.evaluate(() => {
        const d = document.createElement('div');
        d.className = 'elevation-1 elevation-2 keep';
        webui.removeClass(d, 'elevation-');
        return d.className;
    })).toBe('keep');
});
test('webui.removeElements removes matches and runs the action first', async ({ page }) => {
    expect(await page.evaluate(() => {
        const d = document.createElement('div');
        d.innerHTML = '<i>1</i><i>2</i><b></b>';
        const seen = [];
        webui.removeElements(d, 'i', n => seen.push(n.innerText));
        return [seen, d.innerHTML];
    })).toEqual([['1', '2'], '<b></b>']);
});
test('webui.setFlag converts values to true or false', async ({ page }) => {
    expect(await page.evaluate(() => {
        const el = {};
        return [undefined, null, 0, false, 'false', 'null', '0', '', '1', true].map(v => { webui.setFlag(el, 'f', v); return el.f; });
    })).toEqual([false, false, false, false, false, false, false, true, true, true]);
});
test('webui.setProperty sets or removes a property and handles elevation', async ({ page }) => {
    expect(await page.evaluate(() => {
        const el = document.createElement('div');
        webui.setProperty(el, 'thing', 1);
        const set = el.thing;
        webui.setProperty(el, 'thing', null);
        webui.setProperty(el, 'elevation', 3);
        const up = el.className;
        webui.setProperty(el, 'elevation', -2);
        return [set, 'thing' in el, up, el.className];
    })).toEqual([1, false, 'elevation-3', 'elevation-n2']);
});
test('webui.setTheme sets theme variables', async ({ page }) => {
    expect(await page.evaluate(() => {
        const el = document.createElement('div');
        webui.setTheme(el, 'info');
        return [el.style.getPropertyValue('--theme-color'), el.style.getPropertyValue('--theme-color-offset')];
    })).toEqual(['var(--color-info)', 'var(--color-info-offset)']);
});
test('webui.targetMatchesCheck walks up to the parent', async ({ page }) => {
    expect(await page.evaluate(() => {
        const parent = document.createElement('div');
        parent.innerHTML = '<a><b></b></a>';
        const target = parent.querySelector('b');
        let hit;
        const byName = webui.targetMatchesCheck(parent, target, 'A', n => { hit = n.nodeName; });
        const byFn = webui.targetMatchesCheck(parent, target, n => n.nodeName === 'B');
        const miss = webui.targetMatchesCheck(parent, target, 'I');
        return [byName, hit, byFn, miss];
    })).toEqual([true, 'A', true, false]);
});
test('webui.transferChildren moves every child node', async ({ page }) => {
    expect(await page.evaluate(() => {
        const from = document.createElement('div');
        const to = document.createElement('div');
        from.innerHTML = 'a<b></b>';
        webui.transferChildren(from, to);
        return [from.innerHTML, to.innerHTML];
    })).toEqual(['', 'a<b></b>']);
});
test('webui.resolveFunctionFromString finds functions by path', async ({ page }) => {
    expect(await page.evaluate(() => [
        typeof webui.resolveFunctionFromString('webui.uuid'),
        webui.resolveFunctionFromString('Math.max')(1, 2),
        webui.resolveFunctionFromString('nope.nothing'),
        webui.resolveFunctionFromString('Math.PI'),
    ])).toEqual(['function', 2, null, null]);
});
test('webui.log exposes console methods', async ({ page }) => {
    expect(await page.evaluate(() => ['info', 'dir', 'trace', 'error', 'warn', 'time', 'timeEnd', 'assert'].every(k => typeof webui.log[k] === 'function') && typeof webui.log === 'function')).toBe(true);
});
test('webui.alert warns until webui-alerts takes over', async ({ page }) => {
    const warning = page.waitForEvent('console', m => m.text().includes('Alerts are not setup'));
    await page.evaluate(() => webui.alert('hello'));
    await warning;
});
test('webui.copyToClipboard writes the value and alerts', async ({ page }) => {
    expect(await page.evaluate(async () => {
        let copied;
        Object.defineProperty(navigator, 'clipboard', { value: { writeText: async v => { copied = v; } }, configurable: true });
        const alerts = [];
        webui.alert = (m, v) => alerts.push(v);
        await webui.copyToClipboard('abc');
        return [copied, alerts];
    })).toEqual(['abc', ['success']]);
});
test('webui.setApp registers the main app element', async ({ page }) => {
    expect(await page.evaluate(() => {
        const el = document.createElement('div');
        el.main = document.createElement('main');
        el.setPageContent = () => {};
        webui.setApp(el);
        return webui._appSettings.app === el;
    })).toBe(true);
});
test('webui.applyDynamicStyles is safe to call without an app', async ({ page }) => {
    await page.evaluate(() => webui.applyDynamicStyles());
});
