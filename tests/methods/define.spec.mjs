import { test, expect, mount } from '../support/webui.mjs';

test('webui.define requires the app- or webui- prefix', async ({ page }) => {
    expect(await page.evaluate(() => {
        webui.define('bad-name', {});
        webui.define(5, {});
        return customElements.get('bad-name') === undefined;
    })).toBe(true);
});
test('webui.define runs the constructor, attrChanged, and connected', async ({ page }) => {
    await page.evaluate(() => {
        window.__calls = [];
        webui.define('app-life', {
            attr: ['my-value'],
            flags: ['my-flag'],
            constructor() { window.__calls.push('constructor'); },
            attrChanged(property, value) { window.__calls.push(`${property}=${value}`); },
            connected() { window.__calls.push('connected'); },
            disconnected() { window.__calls.push('disconnected'); },
            reconnected() { window.__calls.push('reconnected'); },
        });
    });
    const root = await mount(page, '<app-life my-value="5" my-flag></app-life>');
    await expect.poll(() => page.evaluate(() => window.__calls)).toEqual(['constructor', 'myValue=5', 'myFlag=true', 'connected']);
    const state = await root.locator('app-life').evaluate(el => [el.myValue, el.myFlag, el.classList.length]);
    expect(state).toEqual(['5', true, 0]);
    await page.evaluate(() => {
        window.__calls.length = 0;
        const el = document.querySelector('app-life');
        const parent = el.parentNode;
        el.remove();
        parent.appendChild(el);
    });
    await expect.poll(() => page.evaluate(() => window.__calls)).toEqual(['disconnected', 'reconnected']);
});
test('webui.define keeps _isConnected true after an element moves', async ({ page }) => {
    await page.evaluate(() => webui.define('app-moved', {}));
    const root = await mount(page, '<app-moved></app-moved>');
    expect(await root.locator('app-moved').evaluate(el => {
        const parent = el.parentNode;
        el.remove();
        const whileOut = el._isConnected;
        parent.appendChild(el);
        return [whileOut, el._isConnected];
    })).toEqual([false, true]);
});
test('webui.define shadow templates share one stylesheet', async ({ page }) => {
    await page.evaluate(() => webui.define('app-styled', { shadowTemplate: '<slot></slot><style>:host{display:block;margin-top:7px}</style>' }));
    const root = await mount(page, '<app-styled></app-styled><app-styled></app-styled>');
    const [margin, count, same] = await root.evaluate(r => {
        const [a, b] = r.querySelectorAll('app-styled');
        return [getComputedStyle(a).marginTop, a.shadowRoot.querySelectorAll('style').length, a.shadowRoot.adoptedStyleSheets[0] === b.shadowRoot.adoptedStyleSheets[0]];
    });
    expect(margin).toBe('7px');
    expect(count).toBe(0);
    expect(same).toBe(true);
});
test('webui.define onResize runs after a debounce and stops once removed', async ({ page }) => {
    await page.evaluate(() => {
        window.__resizes = 0;
        webui.define('app-resize', { onResize() { window.__resizes++; } });
    });
    const root = await mount(page, '<app-resize></app-resize>');
    await page.evaluate(() => { window.dispatchEvent(new Event('resize')); window.dispatchEvent(new Event('resize')); });
    await expect.poll(() => page.evaluate(() => window.__resizes)).toBe(1);
    await root.locator('app-resize').evaluate(el => el.remove());
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => window.__resizes)).toBe(1);
});
test('webui.define watchVisibility tracks visibility, including after a move', async ({ page }) => {
    await page.evaluate(() => webui.define('app-vis', { watchVisibility: true }));
    const root = await mount(page, '<app-vis style="display:block;height:20px;position:fixed;top:0;left:0;width:20px">v</app-vis>');
    const el = root.locator('app-vis');
    await expect(el).toHaveAttribute('visible', '1');
    await el.evaluate(node => { node.style.top = '-500px'; });
    await expect(el).not.toHaveAttribute('visible');
    await el.evaluate(node => { const p = node.parentNode; node.remove(); node.style.top = '0'; p.appendChild(node); });
    await expect(el).toHaveAttribute('visible', '1');
});
test('webui.define form inputs join forms, reset, and disable', async ({ page }) => {
    const root = await mount(page, '<form><fieldset><webui-input-text name="q" value="abc"></webui-input-text></fieldset></form>');
    const input = root.locator('webui-input-text');
    const form = root.locator('form');
    expect(await form.evaluate(f => new FormData(f).get('q'))).toBe('abc');
    await form.evaluate(f => f.reset());
    expect(await input.evaluate(el => el.value)).toBe('');
    await root.locator('fieldset').evaluate(f => { f.disabled = true; });
    await expect(input.locator('input')).toBeDisabled();
});
for (const tag of ['webui-input-text', 'webui-input-message', 'webui-input-range']) {
    test(`${tag} submits values set from code or data`, async ({ page }) => {
        const root = await mount(page, `<form><${tag} name="q" data-subscribe="form-key:setValue"></${tag}></form>`);
        const input = root.locator(tag);
        const form = root.locator('form');
        const submitted = () => form.evaluate(f => new FormData(f).get('q'));
        await input.evaluate(el => { el.value = '12'; });
        expect(await submitted()).toBe('12');
        await input.evaluate(el => el.setValue('34'));
        expect(await submitted()).toBe('34');
        await page.evaluate(() => webui.setData('form-key', '56'));
        await expect.poll(submitted).toBe('56');
    });
}
test('a value attribute change updates what the form submits', async ({ page }) => {
    const root = await mount(page, '<form><webui-input-text name="q" value="a"></webui-input-text></form>');
    await root.locator('webui-input-text').evaluate(el => el.setAttribute('value', 'b'));
    expect(await root.locator('form').evaluate(f => new FormData(f).get('q'))).toBe('b');
});
test('buttons in a form do not submit a value', async ({ page }) => {
    const root = await mount(page, '<form><webui-button name="b" data-value="x">Go</webui-button></form>');
    expect(await root.locator('form').evaluate(f => [...new FormData(f).keys()])).toEqual([]);
});
test('elements get the addDataset and hasDataset helpers', async ({ page }) => {
    await page.evaluate(() => webui.define('app-ds', {}));
    const root = await mount(page, '<app-ds></app-ds>');
    expect(await root.locator('app-ds').evaluate(el => {
        const none = el.hasDataset('subscribe');
        el.addDataset('subscribe', 'a:b');
        el.addDataset('subscribe', 'a:b');
        el.addDataset('subscribe', 'c');
        return [none, el.dataset.subscribe, el.hasDataset('subscribe'), el.hasDataset('subscribe', 'c'), el.hasDataset('subscribe', 'z')];
    })).toEqual([false, 'a:b|c', true, true, false]);
});
test('elements get the getSlot, isFlagged, setTheme, setHeight, and triggerChange helpers', async ({ page }) => {
    await page.evaluate(() => webui.define('app-helpers', { flags: ['on'] }));
    const root = await mount(page, '<app-helpers on><b slot="x"></b></app-helpers>');
    expect(await root.locator('app-helpers').evaluate(el => {
        const events = [];
        el.addEventListener('input', () => events.push('input'));
        el.addEventListener('change', () => events.push('change'));
        el.triggerChange();
        el.triggerChange(true);
        el.setTheme('info');
        el.setHeight(10);
        return [el.getSlot('x').nodeName, el.isFlagged('on'), el.isFlagged('off'), events, el.style.getPropertyValue('--theme-color'), el.style.height, el.style.minHeight];
    })).toEqual(['B', true, false, ['change', 'input', 'change'], 'var(--color-info)', '10px', '10px']);
});
test('elements get the snapshot and hasChanges helpers', async ({ page }) => {
    await page.evaluate(() => webui.define('app-snap', { attr: ['thing'] }));
    const root = await mount(page, '<app-snap thing="a"></app-snap>');
    expect(await root.locator('app-snap').evaluate(el => {
        const first = el.hasChanges;
        const same = el.hasChanges;
        el.setAttribute('thing', 'b');
        return [first, same, el.hasChanges, JSON.parse(el.snapshot()).thing];
    })).toEqual([true, false, true, 'b']);
});
