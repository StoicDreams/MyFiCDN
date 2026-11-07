import { test, expect } from '../support/webui.mjs';

// Runs a webui method in the browser, so each test reads as: method, arguments, expected result.
const call = (page, method, ...args) => page.evaluate(([method, args]) => webui[method](...args), [method, args]);

test('webui.escapeCode escapes markup but not quotes', async ({ page }) => {
    expect(await call(page, 'escapeCode', `<a href="x">&'</a>`)).toBe(`&lt;a href="x"&gt;&amp;'&lt;/a&gt;`);
});
test('webui.escapeQuote escapes double quotes only', async ({ page }) => {
    expect(await call(page, 'escapeQuote', `a"b'c`)).toBe(`a&quot;b'c`);
});
test('webui.escapeHtml escapes markup and quotes', async ({ page }) => {
    expect(await call(page, 'escapeHtml', `<&>"'`)).toBe('&lt;&amp;&gt;&quot;&#039;');
});
test('webui.escapeForHTML also escapes slashes and backticks', async ({ page }) => {
    expect(await call(page, 'escapeForHTML', '</a>`')).toBe('&lt;&#x2F;a&gt;&#96;');
});
test('webui.displaySeconds formats durations', async ({ page }) => {
    expect(await call(page, 'displaySeconds', 0)).toBe('0 seconds');
    expect(await call(page, 'displaySeconds', 0, 'none')).toBe('none');
    expect(await call(page, 'displaySeconds', 45)).toBe('45 seconds');
    expect(await call(page, 'displaySeconds', 90)).toBe('1 min, 30 sec');
    expect(await call(page, 'displaySeconds', 3700)).toBe('1 hr, 1 min, 40 sec');
    expect(await call(page, 'displaySeconds', 90000)).toBe('1 day 1 hr, 0 min, 0 sec');
});
test('webui.displayMinutes formats durations', async ({ page }) => {
    expect(await call(page, 'displayMinutes', 0)).toBe('0 minutes');
    expect(await call(page, 'displayMinutes', 45)).toBe('45 minutes');
    expect(await call(page, 'displayMinutes', 90)).toBe('1 hr, 30 min');
    expect(await call(page, 'displayMinutes', 1500)).toBe('1 day 1 hr, 0 min');
});
test('webui.displayLeadingZero pads to the documented total length', async ({ page }) => {
    expect(await call(page, 'displayLeadingZero', 5, 2)).toBe('05');
    expect(await call(page, 'displayLeadingZero', 5, 3)).toBe('005');
    expect(await call(page, 'displayLeadingZero', 123, 2)).toBe('123');
    expect(await call(page, 'displayLeadingZero', 5)).toBe('05');
});
test('webui.formatBytes picks a readable unit', async ({ page }) => {
    expect(await call(page, 'formatBytes', 0)).toBe('0 Bytes');
    expect(await call(page, 'formatBytes', 500)).toBe('500 Bytes');
    expect(await call(page, 'formatBytes', 1536)).toBe('1.5 KB');
    expect(await call(page, 'formatBytes', 1536, 0)).toBe('2 KB');
    expect(await call(page, 'formatBytes', 1024 ** 4)).toBe('1 TB');
});
test('webui.fromBase64 decodes standard and url safe text', async ({ page }) => {
    expect(await call(page, 'fromBase64', 'SGVsbG8')).toBe('Hello');
    expect(await call(page, 'fromBase64', 'Pz8_')).toBe('??' + '?');
});
test('webui.getBase64Size calculates the decoded size', async ({ page }) => {
    expect(await call(page, 'getBase64Size', 'SGVsbG8gV29ybGQ=')).toBe(11);
    expect(await call(page, 'getBase64Size', 'data:text/plain;base64,SGVsbG8gV29ybGQ=')).toBe(11);
    expect(await call(page, 'getBase64Size', '')).toBe(0);
});
test('webui.getDefined returns the first value that is not null or undefined', async ({ page }) => {
    expect(await page.evaluate(() => webui.getDefined(undefined, null, 0, 1))).toBe(0);
    expect(await page.evaluate(() => webui.getDefined(null, undefined) === undefined)).toBe(true);
});
test('webui.hashCode is FNV-1a', async ({ page }) => {
    expect(await call(page, 'hashCode', 'hello')).toBe(0x4f9f2cab | 0);
    expect(await page.evaluate(() => webui.hashCode(undefined))).toBe(0);
    expect(await call(page, 'hashCode', 12)).toBe(-1);
});
test('webui.hashSHA256 returns a hex digest', async ({ page }) => {
    expect(await call(page, 'hashSHA256', 'abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
test('webui.isEqual compares by value', async ({ page }) => {
    expect(await page.evaluate(() => webui.isEqual({ a: [1] }, { a: [1] }))).toBe(true);
    expect(await page.evaluate(() => webui.isEqual(NaN, NaN))).toBe(true);
    expect(await page.evaluate(() => webui.isEqual(1, '1'))).toBe(false);
    expect(await page.evaluate(() => webui.isEqual({ a: 1 }, { a: 2 }))).toBe(false);
});
test('webui.limitChars cuts text to the limit', async ({ page }) => {
    expect(await call(page, 'limitChars', 'hello', 3)).toBe('hel');
    expect(await call(page, 'limitChars', 'hi', 3)).toBe('hi');
    expect(await call(page, 'limitChars', 'hello', 'x')).toBe('hello');
});
test('webui.unitIfNumber only adds a unit to plain numbers', async ({ page }) => {
    expect(await call(page, 'unitIfNumber', 5, 'em')).toBe('5em');
    expect(await call(page, 'unitIfNumber', '5', 'em')).toBe('5em');
    expect(await call(page, 'unitIfNumber', '5%', 'em')).toBe('5%');
});
test('webui.pxIfNumber adds px to plain numbers', async ({ page }) => {
    expect(await call(page, 'pxIfNumber', 5)).toBe('5px');
    expect(await call(page, 'pxIfNumber', '2em')).toBe('2em');
});
test('webui.msIfNumber adds ms to plain numbers', async ({ page }) => {
    expect(await call(page, 'msIfNumber', 5)).toBe('5ms');
    expect(await call(page, 'msIfNumber', '2s')).toBe('2s');
});
test('webui.removeWrappingPTags unwraps matching tags', async ({ page }) => {
    expect(await call(page, 'removeWrappingPTags', '<p><webui-x>a</webui-x></p>', 'webui-x')).toBe('<webui-x>a</webui-x>');
    expect(await call(page, 'removeWrappingPTags', '<p>text</p>', 'webui-x')).toBe('<p>text</p>');
});
test('webui.repeat repeats text', async ({ page }) => {
    expect(await call(page, 'repeat', 'ab', 3)).toBe('ababab');
    expect(await call(page, 'repeat', 'ab', 0)).toBe('');
});
test('webui.toSnake converts to the given delimiter', async ({ page }) => {
    expect(await call(page, 'toSnake', 'fooBar')).toBe('foo_bar');
    expect(await call(page, 'toSnake', 'fooBar', '-')).toBe('foo-bar');
    expect(await call(page, 'toSnake', 'foo-bar baz', '_')).toBe('foo_bar_baz');
    // Both delimiters in a row must not share a cached result.
    expect(await call(page, 'toSnake', 'fooBar', '_')).toBe('foo_bar');
});
test('webui.toCamel converts separated words', async ({ page }) => {
    expect(await call(page, 'toCamel', 'foo-bar baz')).toBe('fooBarBaz');
    expect(await call(page, 'toCamel', 'Foo-bar')).toBe('fooBar');
});
test('webui.toPascel converts separated words', async ({ page }) => {
    expect(await call(page, 'toPascel', 'foo-bar')).toBe('FooBar');
});
test('webui.trimLinePreTabs removes the shared indentation', async ({ page }) => {
    expect(await call(page, 'trimLinePreTabs', 'a\n    b\n      c')).toBe('a\nb\n  c');
    expect(await call(page, 'trimLinePreTabs', 'a\nb')).toBe('a\nb');
});
test('webui.trimLinePreWhitespce trims every line', async ({ page }) => {
    expect(await call(page, 'trimLinePreWhitespce', '  a\n\tb  ')).toBe('a\nb');
});
test('webui.uuid creates unique ids', async ({ page }) => {
    const [a, b] = await page.evaluate(() => [webui.uuid(), webui.uuid()]);
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(a).not.toBe(b);
});
test('webui.validateUrl checks format and protocol', async ({ page }) => {
    expect(await call(page, 'validateUrl', 'https://a.com')).toBe(true);
    expect(await call(page, 'validateUrl', 'nope')).toBe(false);
    expect(await call(page, 'validateUrl', 'ftp://a.com')).toBe(false);
    expect(await call(page, 'validateUrl', 'ftp://a.com', ['ftp:'])).toBe(true);
});
test('webui.parseMarkdown converts markdown', async ({ page }) => {
    expect(await call(page, 'parseMarkdown', '# Title')).toContain('<h1');
    expect(await page.evaluate(() => webui.parseMarkdown(12))).toBe(12);
});
test('webui.parseWebuiMarkdown converts markdown', async ({ page }) => {
    expect(await call(page, 'parseWebuiMarkdown', '**bold**')).toContain('<strong>bold</strong>');
});
test('webui.markdown is the loaded parser', async ({ page }) => {
    expect(await page.evaluate(() => webui.markdown.parse('*a*'))).toContain('<em>a</em>');
});
test('webui.applyAppDataToContent applies data then markdown', async ({ page }) => {
    expect(await page.evaluate(() => webui.applyAppDataToContent('Hi **{NAME}**', { name: 'Sam' }))).toContain('<strong>Sam</strong>');
    expect(await page.evaluate(() => webui.applyAppDataToContent('Hi', false, true))).not.toContain('<p>');
});
test('webui.replaceAppData fills placeholders from data', async ({ page }) => {
    const result = await page.evaluate(() => {
        webui.setData('page-thing', 'T');
        webui.setData('session-thing', 'S');
        return [
            webui.replaceAppData('{APP_NAME}|{NAME}'),
            webui.replaceAppData('{PAGE_THING}|{THING}'),
            webui.replaceAppData('{UNKNOWN} {"a":1}'),
            webui.replaceAppData('{X}', { x: 'row' }),
        ];
    });
    expect(result).toEqual(['My Fidelity CDN|My Fidelity CDN', 'T|S', '{UNKNOWN} {"a":1}', 'row']);
});
test('webui.replaceAppData keeps $ literal and expands nested placeholders', async ({ page }) => {
    const result = await page.evaluate(() => {
        webui.setData('price', '$& x');
        webui.setData('nested', 'is {PRICE}');
        webui.setData('loop', '{LOOP}');
        return [webui.replaceAppData('A{PRICE}B'), webui.replaceAppData('{NESTED}'), webui.replaceAppData('{LOOP}')];
    });
    expect(result).toEqual(['A$& xB', 'is $& x', '{LOOP}']);
});
test('webui.replaceAppData sees keys added after an earlier call', async ({ page }) => {
    const result = await page.evaluate(() => {
        const before = webui.replaceAppData('{LATE_KEY}');
        webui.setData('late-key', 'here');
        const after = webui.replaceAppData('{LATE_KEY}');
        webui.setData('late-key', undefined);
        return [before, after, webui.replaceAppData('{LATE_KEY}')];
    });
    expect(result).toEqual(['{LATE_KEY}', 'here', '{LATE_KEY}']);
});
test('webui.replaceData fills row placeholders', async ({ page }) => {
    const data = { 'foo-bar': 'x', empty: null, price: '$1' };
    expect(await page.evaluate(d => webui.replaceData('{FOO_BAR}|{TEMPLATE_FOO_BAR}|{EMPTY}|{PRICE}', d), data)).toBe('x|x||$1');
    expect(await page.evaluate(() => webui.replaceData('{TEMPLATE_ROWDATA}', { a: 1 }))).toContain('&quot;a&quot;');
});
test('webui.sanitize removes script execution', async ({ page }) => {
    const dirty = `<script>1</script><img src=x onerror=alert(1)><a href=" java\nscript:alert(2)">a</a>
<button formaction="javascript:alert(3)">b</button><svg><a xlink:href="javascript:alert(4)"><text>t</text></a>
<a><animate attributeName="href" values="javascript:alert(5)"/></a></svg><template><img src=x onerror=alert(6)></template>
<a href="data:text/html,x">z</a><iframe src="/x"></iframe><!-- c -->`;
    const clean = await call(page, 'sanitize', dirty);
    expect(clean).not.toMatch(/<script|onerror|javascript:|<animate|data:text|<iframe|<!--/i);
});
test('webui.sanitize keeps ordinary markup', async ({ page }) => {
    const clean = await call(page, 'sanitize', '<p class="a">Hi <b>x</b> <a href="/y">l</a> <img src="data:image/png;base64,AA"></p>');
    expect(clean).toContain('class="a"');
    expect(clean).toContain('href="/y"');
    expect(clean).toContain('data:image/png');
    expect(await page.evaluate(() => webui.sanitize(5))).toBe('');
});
test('webui.sanitizeInput leaves plain text untouched', async ({ page }) => {
    for (const text of ['Tom & Jerry', 'a < b', '  lead', 'x > y']) {
        expect(await call(page, 'sanitizeInput', text)).toBe(text);
    }
    expect(await call(page, 'sanitizeInput', 'Use <b>bold</b> & more')).toBe('Use <b>bold</b> & more');
    expect(await call(page, 'sanitizeInput', '<img src=x onerror=alert(1)>')).not.toContain('onerror');
});
test('webui.parseMarkdown writes code blocks with language, not the HTML lang attribute', async ({ page }) => {
    await page.waitForFunction(() => webui.markdown && webui.markdown.constructor.name === 'MarkdownParser');
    const html = await page.evaluate(() => webui.parseMarkdown('```js\nlet a = 1;\n```'));
    expect(html).toContain('<webui-code language="js">');
    expect(html).not.toContain(' lang=');
});
