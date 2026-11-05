import { test, expect, mount } from '../support/webui.mjs';

test('label replaces the content', async ({ page }) => {
    const root = await mount(page, '<webui-button label="Save">a<b>c</b>d</webui-button>');
    await expect(root.locator('webui-button')).toHaveText('Save');
});
test('icons go in their slots', async ({ page }) => {
    const root = await mount(page, '<webui-button start-icon="xmark" end-icon="arrow">x</webui-button>');
    await expect(root.locator('webui-button > [slot="start-icon"]')).toHaveAttribute('icon', 'xmark');
    await expect(root.locator('webui-button > [slot="end-icon"]')).toHaveAttribute('icon', 'arrow');
});
test('data-trigger writes data-value on click', async ({ page }) => {
    const root = await mount(page, '<webui-button data-trigger="btn-a" data-value="42">x</webui-button><webui-button data-trigger="btn-b" id="b">y</webui-button>');
    await root.locator('webui-button').first().click();
    await expect.poll(() => page.evaluate(() => webui.getData('btn-a'))).toBe('42');
    await root.locator('webui-button').nth(1).click();
    await expect.poll(() => page.evaluate(() => webui.getData('btn-b'))).toBe('1');
});
test('data-transfer copies every listed key', async ({ page }) => {
    await page.evaluate(() => { webui.setData('s1', 'A'); webui.setData('s2', 'B'); });
    const root = await mount(page, '<webui-button data-transfer="s1:d1|s2:d2">x</webui-button>');
    await root.locator('webui-button').click();
    expect(await page.evaluate(() => [webui.getData('d1'), webui.getData('d2')])).toEqual(['A', 'B']);
});
test('data-clear removes listed keys', async ({ page }) => {
    await page.evaluate(() => { webui.setData('c1', 1); webui.setData('c2', 2); });
    const root = await mount(page, '<webui-button data-clear="c1|c2">x</webui-button>');
    await root.locator('webui-button').click();
    expect(await page.evaluate(() => [webui.getData('c1'), webui.getData('c2')])).toEqual([undefined, undefined]);
});
test('data-remove-item removes from arrays and objects, and ignores missing data', async ({ page }) => {
    await page.evaluate(() => { webui.setData('list', ['a', 'b']); webui.setData('map', { k: 1, j: 2 }); });
    const root = await mount(page, '<webui-button id="a" data-remove-item="list:0"></webui-button><webui-button data-remove-item="map:k"></webui-button><webui-button data-remove-item="none:0"></webui-button>');
    const buttons = root.locator('webui-button');
    for (let i = 0; i < 3; i++) await buttons.nth(i).evaluate(el => el.click());
    expect(await page.evaluate(() => [webui.getData('list'), webui.getData('map')])).toEqual([['b'], { j: 2 }]);
});
test('submit submits its form, and is harmless without one', async ({ page }) => {
    const root = await mount(page, '<form><webui-button submit>Go</webui-button></form><webui-button submit id="lone">Lone</webui-button>');
    expect(await root.evaluate(r => {
        let submits = 0;
        const form = r.querySelector('form');
        form.addEventListener('submit', ev => { ev.preventDefault(); submits++; });
        form.querySelector('webui-button').click();
        r.querySelector(':scope > webui-button').click();
        return submits;
    })).toBe(1);
});
test('a form reset leaves data-value buttons working', async ({ page }) => {
    const root = await mount(page, '<form><webui-button data-trigger="btn-r" data-value="9">x</webui-button></form>');
    await root.locator('form').evaluate(f => f.reset());
    await root.locator('webui-button').click();
    await expect.poll(() => page.evaluate(() => webui.getData('btn-r'))).toBe('9');
});
