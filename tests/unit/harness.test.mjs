import { test, expect, mount } from './support/webui.mjs';

// The harness's own matchers: each must fail when what it checks is not so, or every test using it proves nothing.
test('matchers fail when they should', async ({ page }) => {
    const root = await mount(page, '<div><b>A</b></div>');
    const fails = async fn => { try { await fn(); return false; } catch { return true; } };
    expect(await fails(() => expect(root.locator('td')).toHaveText(['A', 'B'], { timeout: 100 }))).toBe(true);
    expect(await fails(() => expect(root.locator('td')).toHaveCount(2, { timeout: 100 }))).toBe(true);
    expect(await fails(() => expect(root.locator('b')).toHaveText('A'))).toBe(false);
    expect(await fails(() => expect(root.locator('b')).not.toHaveText('A', { timeout: 100 }))).toBe(true);
    expect(await fails(() => expect(root.locator('b')).not.toHaveText('Z'))).toBe(false);
    expect(await fails(() => expect(root.locator('b')).toBeHidden({ timeout: 100 }))).toBe(true);
    // expect.poll retries until the assertion holds, and fails once its time is up.
    let calls = 0;
    expect(await fails(() => expect.poll(() => ++calls).toBeGreaterThan(3))).toBe(false);
    expect(await fails(() => expect.poll(() => 1, { timeout: 100 }).toBe(2))).toBe(true);
    expect(await fails(() => expect.poll(() => 1, { timeout: 100 }).not.toBe(1))).toBe(true);
    expect(await fails(() => expect.poll(() => 1).not.toBe(2))).toBe(false);
});
test('a fieldset is a group named by its legend, as in a browser', async ({ page }) => {
    const root = await mount(page, '<fieldset><legend>Size</legend><label><input type="radio" name="s"> Small</label></fieldset>');
    await expect(root.getByRole('group', { name: 'Size' }).getByRole('radio', { name: 'Small' })).toHaveCount(1);
});
test('all() gives a locator for each element, as in Playwright', async ({ page }) => {
    const root = await mount(page, '<a title="one">1</a><a title="two">2</a>');
    const links = await root.locator('a').all();
    expect(links).toHaveLength(2);
    await expect(links[1]).toHaveAttribute('title', 'two');
});
test('waitForURL waits for the address to match', async ({ page }) => {
    await mount(page, '<p>x</p>');
    await page.evaluate(() => setTimeout(() => history.pushState(null, '', '/later/page'), 50));
    await page.waitForURL('**/later/page');
    await page.waitForURL(/later\/page$/);
    let failed = false;
    try { await page.waitForURL('**/elsewhere', { timeout: 100 }); } catch { failed = true; }
    expect(failed).toBe(true);
});
test('toHaveText reads a select\'s options, as Playwright does', async ({ page }) => {
    const root = await mount(page, '<label>Pick <select><option>One</option><option>Two</option></select></label>');
    await expect(root.getByLabel('Pick')).toContainText('Two');
    await expect(root.getByLabel('Pick', { exact: true })).toHaveCount(1);
});
test('getByLabel finds any element by its aria-label, as Playwright does', async ({ page }) => {
    const root = await mount(page, '<pre aria-label="Results">Done</pre>');
    await expect(root.getByLabel('Results')).toContainText('Done');
});
test('a dropped file arrives in the drop event, as in a browser', async ({ page }) => {
    await mount(page, '<div id="zone"></div>');
    const name = await page.evaluate(() => {
        const zone = document.getElementById('zone');
        let got = null;
        zone.addEventListener('drop', event => { got = event.dataTransfer.files[0]?.name; });
        const transfer = new DataTransfer();
        transfer.items.add(new File(['x'], 'a.txt', { type: 'text/plain' }));
        zone.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: transfer }));
        return got;
    });
    expect(name).toBe('a.txt');
});
test('text pseudo-classes work inside :is() and before a combinator, as in Playwright', async ({ page }) => {
    const root = await mount(page, '<h2>Latest Release</h2><ul><li>A</li></ul><h2>Other</h2><ul><li>B</li></ul>');
    await expect(root.locator('h2:is(:text("Latest Release"), :text("Nope")) + ul > li')).toHaveText(['A']);
    await expect(root.locator('h2:text("Other") ~ ul li')).toHaveText(['B']);
});
test('an action finds its element again when it is drawn again, as in Playwright', async ({ page }) => {
    const root = await mount(page, '<div id="box"><input name="a" hidden></div>');
    await page.evaluate(() => setTimeout(() => { document.getElementById('box').innerHTML = '<input name="a">'; }, 50));
    await root.locator('input[name="a"]').fill('typed');
    await expect(root.locator('input[name="a"]')).toHaveValue('typed');
});
test('dragged files show in the types as Files, and allInnerTexts reads each element', async ({ page }) => {
    const root = await mount(page, '<i>a</i><i>b</i>');
    expect(await root.locator('i').allInnerTexts()).toEqual(['a', 'b']);
    const types = await page.evaluate(() => {
        const transfer = new DataTransfer();
        transfer.items.add(new File(['x'], 'x.txt'));
        return [...transfer.types];
    });
    expect(types).toContain('Files');
});
