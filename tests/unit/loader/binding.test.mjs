import { test, expect, mount } from '../support/webui.mjs';

test('data-subscribe writes values to plain elements', async ({ page }) => {
    const root = await mount(page, '<span id="h" data-subscribe="bind-a:innerHTML"></span><span id="t" data-subscribe="bind-a:innerText"></span>');
    await page.evaluate(() => webui.setData('bind-a', 'hello'));
    await expect(root.locator('#h')).toHaveText('hello');
    await expect(root.locator('#t')).toContainText('hello');
});
test('a bound native field has the new value at once, so a form sent right after a change sends it', async ({ page }) => {
    const root = await mount(page, '<form><input type="hidden" name="pick" data-subscribe="bind-pick"></form>');
    const values = await page.evaluate(() => {
        const input = document.querySelector('input[name="pick"]');
        const before = input.value;
        webui.setData('bind-pick', '61');
        const after = new FormData(input.form).get('pick');
        webui.setData('bind-pick', null);
        return [before, after, input.value];
    });
    // Before any data, and after it is cleared, the field is empty, never the text "undefined".
    expect(values).toEqual(['', '61', '']);
    await expect(root.locator('input[name="pick"]')).toHaveValue('');
});
test('data-subscribe matches camelCase keys', async ({ page }) => {
    const root = await mount(page, '<span data-subscribe="myThing:innerHTML"></span>');
    await page.evaluate(() => webui.setData('my-thing', 'hello'));
    await expect(root.locator('span')).toHaveText('hello');
});
test('data-subscribe to a nested key updates when its parent changes', async ({ page }) => {
    const root = await mount(page, '<span data-subscribe="user.name:innerHTML"></span>');
    await page.evaluate(() => webui.setData('user', { name: 'Sam' }));
    await expect(root.locator('span')).toHaveText('Sam');
});
test('data-subscribe calls named setters on components', async ({ page }) => {
    await page.evaluate(() => webui.define('app-sub', { attr: [], setMyKey(v) { this.got = v; }, custom(v, k) { this.other = [v, k]; } }));
    const root = await mount(page, '<app-sub data-subscribe="my-key|other-key:custom"></app-sub>');
    await page.evaluate(() => { webui.setData('my-key', 1); webui.setData('other-key', 2); });
    await expect.poll(() => root.locator('app-sub').evaluate(el => [el.got, el.other])).toEqual([1, [2, 'other-key']]);
});
test('data-subscribe reaches components that finish loading late', async ({ page }) => {
    // The component's script is held until the test lets it go, so the element is on the page, and its
    // subscription registered, before the component exists.
    let requested, release;
    const wasRequested = new Promise(resolve => { requested = resolve; });
    const released = new Promise(resolve => { release = resolve; });
    await page.route('**/webui/condition.*', async route => {
        requested();
        await released;
        await route.fallback();
    });
    // mount waits for the component, so it only finishes once the script is let go.
    const mounting = mount(page, '<webui-condition data-subscribe="late-key:setValue"><template slot="invalid">{TEMPLATE_LATE_KEY}not valid</template></webui-condition>');
    // The loader registers an element's subscription before it asks for its script.
    await wasRequested;
    release();
    const root = await mounting;
    await expect(root.locator('webui-condition')).toHaveText('not valid');
});
test('data-subscribe adds and swaps classes', async ({ page }) => {
    const root = await mount(page, '<span data-subscribe="bind-class:class"></span>');
    await page.evaluate(() => webui.setData('bind-class', 'one'));
    await expect(root.locator('span')).toHaveClass('one');
    await page.evaluate(() => webui.setData('bind-class', 'two'));
    await expect(root.locator('span')).toHaveClass('two');
});
test('data-trigger writes input values to data', async ({ page }) => {
    const root = await mount(page, '<input data-trigger="bind-t"><input type="hidden" id="hid" data-trigger="bind-h">');
    await root.locator('input').first().fill('typed');
    await expect.poll(() => page.evaluate(() => webui.getData('bind-t'))).toBe('typed');
    await root.locator('#hid').evaluate(el => el.setAttribute('value', 'hidden'));
    await expect.poll(() => page.evaluate(() => webui.getData('bind-h'))).toBe('hidden');
});
test('data-trigger works on clicked native buttons', async ({ page }) => {
    const root = await mount(page, '<button data-trigger="bind-b" data-value="42">go</button>');
    await root.locator('button').click();
    await expect.poll(() => page.evaluate(() => webui.getData('bind-b'))).toBe('42');
});
test('data-trigger on a link with a target does not throw', async ({ page }) => {
    const root = await mount(page, '<a href="#x" target="_blank" data-trigger="bind-l" data-value="1">go</a>');
    await root.locator('a').evaluate(el => el.addEventListener('click', ev => ev.preventDefault()));
    await root.locator('a').dispatchEvent('click');
    await expect.poll(() => page.evaluate(() => webui.getData('bind-l'))).toBe('1');
});
test('data-bind syncs both directions', async ({ page }) => {
    const root = await mount(page, '<input data-bind="bind-both:value">');
    await page.evaluate(() => webui.setData('bind-both', 'from data'));
    await expect(root.locator('input')).toHaveValue('from data');
    await root.locator('input').fill('from input');
    await expect.poll(() => page.evaluate(() => webui.getData('bind-both'))).toBe('from input');
});
test('data-default sets missing data', async ({ page }) => {
    await mount(page, '<span data-default="bind-d:start"></span>');
    await expect.poll(() => page.evaluate(() => webui.getData('bind-d'))).toBe('start');
});
test('data-default with only a value sets the default for the bound key', async ({ page }) => {
    await mount(page, '<input data-bind="bind-own" data-default="start"><span data-trigger="bind-trigger:value" data-default="other"></span>');
    await expect.poll(() => page.evaluate(() => [webui.getData('bind-own'), webui.getData('bind-trigger')])).toEqual(['start', 'other']);
});
test('data-default with only a value leaves existing data alone', async ({ page }) => {
    await page.evaluate(() => webui.setData('bind-kept', 'saved'));
    // The second element comes later in the page, so once its default is set the first element's was handled.
    const root = await mount(page, '<input data-bind="bind-kept" data-default="start"><span data-default="bind-handled:yes"></span>');
    await expect.poll(() => page.evaluate(() => webui.getData('bind-handled'))).toBe('yes');
    await expect(root.locator('input')).toHaveValue('saved');
    expect(await page.evaluate(() => webui.getData('bind-kept'))).toBe('saved');
});
test('data-default turns a bound toggle on', async ({ page }) => {
    const root = await mount(page, '<webui-toggle-icon data-bind="bind-toggle" data-default="true"></webui-toggle-icon>');
    await expect.poll(() => root.locator('webui-toggle-icon').evaluate(el => el.value)).toBe(true);
});
test('an input that writes to data starts the data at its own value', async ({ page }) => {
    // The last input comes after the checkbox and the button, so once its start value is in data theirs were handled.
    await mount(page, '<webui-input-range min="5" max="105" step="5" value="5" data-subscribe="start-filter.count:setValue" data-trigger="start-filter.count"></webui-input-range><input value="abc" data-bind="start-text"><input type="checkbox" value="on" data-trigger="start-check"><webui-button data-trigger="start-button" data-value="clicked" value="no"></webui-button><input value="last" data-bind="start-last">');
    await expect.poll(() => page.evaluate(() => webui.getData('start-filter'))).toEqual({ count: '5' });
    await expect.poll(() => page.evaluate(() => [webui.getData('start-text'), webui.getData('start-last')])).toEqual(['abc', 'last']);
    // A checkbox's value is there even when unchecked, and a button only writes when clicked.
    expect(await page.evaluate(() => [webui.getData('start-check'), webui.getData('start-button')])).toEqual([undefined, undefined]);
});
test('an input start value leaves existing data alone', async ({ page }) => {
    await page.evaluate(() => webui.setData('start-kept', '40'));
    await mount(page, '<webui-input-range min="5" max="105" step="5" value="5" data-bind="start-kept"></webui-input-range>');
    await expect.poll(() => page.evaluate(() => webui.getData('start-kept'))).toBe('40');
});
test('data-hide follows a selector', async ({ page }) => {
    const root = await mount(page, '<span id="s" data-hide=".needed">x</span>');
    await expect(root.locator('#s')).toBeHidden();
    await root.evaluate(r => r.appendChild(Object.assign(document.createElement('i'), { className: 'needed' })));
    await expect(root.locator('#s')).toBeVisible();
});
test('data-state restores saved attributes', async ({ page }) => {
    const root = await mount(page, '<aside class="stateful" data-state="mode"></aside>');
    await root.locator('aside').evaluate(el => el.setAttribute('mode', 'wide'));
    await expect.poll(() => page.evaluate(() => webui.storage.getItem('aside_stateful'))).toBe('{"mode":"wide"}');
    const again = await mount(page, '<aside class="stateful" data-state="mode"></aside>');
    await expect(again.locator('aside')).toHaveAttribute('mode', 'wide');
});
test('elevation, theme, and position attributes are applied', async ({ page }) => {
    const root = await mount(page, '<div elevation="3" theme="info" top="5" left="1em"></div>');
    const div = root.locator('div');
    await expect(div).toHaveClass('elevation-3');
    await expect.poll(() => div.evaluate(el => [el.style.top, el.style.left, el.style.getPropertyValue('--theme-color')])).toEqual(['5px', '1em', 'var(--color-info)']);
    await div.evaluate(el => el.setAttribute('elevation', '-2'));
    await expect(div).toHaveClass('elevation-n2');
});
test('attributes inside code blocks and templates are not applied', async ({ page }) => {
    // The paragraph comes later in the page, so once its elevation is applied the code block was handled.
    const root = await mount(page, '<code><div elevation="3"></div></code><template><div elevation="3"></div></template><p elevation="2"></p>');
    await expect(root.locator('p')).toHaveClass('elevation-2');
    await expect(root.locator('code div')).not.toHaveClass(/elevation/);
    expect(await root.locator('template').evaluate(el => el.content.querySelector('div').className)).toBe('');
});
test('components load automatically, and a list of preloads tolerates extra separators', async ({ page }) => {
    const requests = [];
    page.on('request', request => requests.push(new URL(request.url()).pathname));
    await page.evaluate(() => webui.define('app-pl', { preload: 'paper, quote ;line' }));
    await mount(page, '<app-pl></app-pl>');
    await expect.poll(() => page.evaluate(() => ['webui-paper', 'webui-quote', 'webui-line'].every(n => customElements.get(n)))).toBe(true);
    // Every name in the list is requested in one go, so a request for an empty name would have been made with the
    // last of these, which has loaded.
    await expect.poll(() => requests.filter(path => /\/webui\/(paper|quote|line)\./.test(path)).length).toBe(3);
    expect(requests.filter(path => /\/webui\/\.(min\.)?js$/.test(path))).toEqual([]);
});
test('a component that fails to load is only retried a few times', async ({ page }) => {
    let requests = 0;
    await page.route('**/webui/does-not-exist.*', route => { requests++; return route.fulfill({ status: 404, body: '' }); });
    const add = name => page.evaluate(name => { document.body.appendChild(document.createElement(name)); }, name);
    const loading = () => page.evaluate(() => !!document.head.querySelector('script[src*="/webui/does-not-exist."]'));
    for (let attempt = 1; attempt <= 3; attempt++) {
        await add('webui-does-not-exist');
        await expect.poll(() => requests).toBe(attempt);
        // The loader takes the script off the page when it fails, and only then is the next attempt allowed.
        await expect.poll(loading).toBe(false);
    }
    for (let i = 0; i < 3; i++) await add('webui-does-not-exist');
    // Another missing component, added last, is asked for after the loader has dealt with the elements before it.
    let later = 0;
    await page.route('**/webui/also-missing.*', route => { later++; return route.fulfill({ status: 404, body: '' }); });
    await add('webui-also-missing');
    await expect.poll(() => later).toBe(1);
    expect(requests).toBe(3);
});
test('session data survives a reload', async ({ page }) => {
    await page.evaluate(() => webui.setData('session-keep', 'v1'));
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem('session-data'))).toContain('v1');
    await page.reload();
    await page.waitForFunction(() => typeof webui === 'object' && webui.loaded);
    await expect.poll(() => page.evaluate(() => webui.getData('session-keep'))).toBe('v1');
});
test('corrupt session data does not stop the framework loading', async ({ page }) => {
    await page.evaluate(() => sessionStorage.setItem('session-data', '{bad'));
    await page.reload();
    await page.waitForFunction(() => typeof webui === 'object' && webui.loaded);
});
