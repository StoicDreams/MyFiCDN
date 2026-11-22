import { test, expect, mount } from '../support/webui.mjs';

test('highlights code from its content', async ({ page }) => {
    const root = await mount(page, '<webui-code lang="javascript" label="Sample">const a = 1;</webui-code>');
    const code = root.locator('webui-code');
    await expect(code.locator('code .keyword')).toHaveText('const');
    await expect(code.locator('code .number')).toHaveText('1');
    await expect(code.locator('label > span')).toHaveText('Sample');
    await expect(code.locator('code')).toHaveClass(/language-javascript/);
});
test('setValue escapes markup, and stringifies objects', async ({ page }) => {
    const root = await mount(page, '<webui-code></webui-code>');
    const code = root.locator('webui-code');
    await code.evaluate(el => el.setValue('<img src=x onerror=alert(1)>'));
    await expect(code.locator('img')).toHaveCount(0);
    await expect(code.locator('code')).toContainText('<img');
    await code.evaluate(el => el.setValue({ a: 1 }));
    await expect(code.locator('code')).toContainText('"a": 1');
    await expect.poll(() => code.evaluate(el => el.value)).toContain('"a": 1');
});
test('text is not highlighted', async ({ page }) => {
    const root = await mount(page, '<webui-code lang="text"></webui-code>');
    const code = root.locator('webui-code');
    await code.evaluate(el => el.setValue("Don't guess. I haven't said # 2 -- yet."));
    await expect(code.locator('code')).toHaveText("Don't guess. I haven't said # 2 -- yet.");
    await expect(code.locator('code span')).toHaveCount(0);
});
test('highlights html tags and attributes', async ({ page }) => {
    const root = await mount(page, '<webui-code lang="html"></webui-code>');
    const code = root.locator('webui-code');
    await code.evaluate(el => el.setValue('<div id="x">y</div>'));
    await expect(code.locator('.selector-tag').first()).toHaveText('div');
    await expect(code.locator('.attribute')).toHaveText('id');
    await expect(code.locator('.string')).toHaveText('x');
});
test('large code highlights quickly', async ({ page }) => {
    const root = await mount(page, '<webui-code></webui-code>');
    // Eight times the code takes about eight times as long when each character is looked at once, and about
    // sixty-four times as long when the rest of the code is scanned from every character. Comparing the two,
    // with the best of three runs each, gives the same answer on a slow or busy machine, where a time limit
    // would not.
    const [small, large] = await root.locator('webui-code').evaluate(el => {
        const time = repeats => {
            const text = 'plain words without any matches at all '.repeat(repeats);
            return Math.min(...[1, 2, 3].map(() => {
                const start = performance.now();
                el.setValue(text);
                return performance.now() - start;
            }));
        };
        return [time(1000), time(8000)];
    });
    expect(large / small).toBeLessThan(32);
});
test('the copy icon copies the code', async ({ page }) => {
    const root = await mount(page, '<webui-code>abc</webui-code>');
    await page.evaluate(() => {
        Object.defineProperty(navigator, 'clipboard', { value: { writeText: async v => { window.__copied = v; } }, configurable: true });
    });
    await root.locator('webui-code label webui-icon').click();
    await expect.poll(() => page.evaluate(() => window.__copied)).toBe('abc');
});
test('value and copy keep the exact text set with setValue', async ({ page }) => {
    const root = await mount(page, '<webui-code lang="html"></webui-code>');
    await page.evaluate(() => {
        Object.defineProperty(navigator, 'clipboard', { value: { writeText: async v => { window.__copied = v; } }, configurable: true });
    });
    const code = root.locator('webui-code');
    const text = '\t<a href="?a=1&b=2" title="x &amp; y">Tom & Jerry</a>\n\t\tend  \n';
    await code.evaluate((el, v) => el.setValue(v), text);
    await expect(code.locator('code')).toContainText('Tom & Jerry');
    await expect.poll(() => code.evaluate(el => el.value)).toBe(text);
    await code.locator('label webui-icon').click();
    await expect.poll(() => page.evaluate(() => window.__copied)).toBe(text);
});
test('code written in the tag reads back as text', async ({ page }) => {
    const root = await mount(page, '<webui-code lang="html">&lt;b&gt;a &amp;amp; b&lt;/b&gt;</webui-code>');
    await expect.poll(() => root.locator('webui-code').evaluate(el => el.value)).toBe('<b>a &amp; b</b>');
});
test('nocopy hides the copy icon', async ({ page }) => {
    const root = await mount(page, '<webui-code nocopy>abc</webui-code>');
    await expect(root.locator('webui-code label webui-icon')).toBeHidden();
});
test('nocopy without a label hides the label row', async ({ page }) => {
    const root = await mount(page, '<webui-code nocopy>abc</webui-code>');
    await expect(root.locator('webui-code')).toHaveClass(/hide-label/);
});
test('src loads a file, and reports failures', async ({ page }) => {
    const root = await mount(page, '<webui-code src="/robots.txt"></webui-code><webui-code src="/missing.txt"></webui-code>');
    await expect(root.locator('webui-code code').first()).toContainText('User-agent');
    await expect(root.locator('webui-code code').nth(1)).toContainText('Failed to load file');
});
test('lines sets how many lines show, and removing it lets the code size itself', async ({ page }) => {
    const root = await mount(page, '<webui-code lines="3">a\nb</webui-code>');
    const code = root.locator('webui-code code');
    // The height is the point of lines, so the style it sets is what is checked.
    await expect.poll(() => code.evaluate(c => c.style.height)).toContain('3 * var(--line-height)');
    await root.locator('webui-code').evaluate(c => c.removeAttribute('lines'));
    await expect.poll(() => code.evaluate(c => c.style.height)).toBe('');
});
