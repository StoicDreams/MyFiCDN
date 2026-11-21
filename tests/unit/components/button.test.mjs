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
    await expect.poll(() => page.evaluate(() => [webui.getData('d1'), webui.getData('d2')])).toEqual(['A', 'B']);
});
test('data-clear removes listed keys', async ({ page }) => {
    await page.evaluate(() => { webui.setData('c1', 1); webui.setData('c2', 2); });
    const root = await mount(page, '<webui-button data-clear="c1|c2">x</webui-button>');
    await root.locator('webui-button').click();
    await expect.poll(() => page.evaluate(() => [webui.getData('c1'), webui.getData('c2')])).toEqual([undefined, undefined]);
});
test('data-remove-item removes from arrays and objects, and ignores missing data', async ({ page }) => {
    await page.evaluate(() => { webui.setData('list', ['a', 'b']); webui.setData('map', { k: 1, j: 2 }); });
    const root = await mount(page, '<webui-button id="a" data-remove-item="list:0"></webui-button><webui-button data-remove-item="map:k"></webui-button><webui-button data-remove-item="none:0"></webui-button>');
    const buttons = root.locator('webui-button');
    for (let i = 0; i < 3; i++) await buttons.nth(i).evaluate(el => el.click());
    await expect.poll(() => page.evaluate(() => [webui.getData('list'), webui.getData('map')])).toEqual([['b'], { j: 2 }]);
});
test('submit submits its form, and is harmless without one', async ({ page }) => {
    const root = await mount(page, '<form><webui-button submit>Go</webui-button></form><webui-button submit id="lone">Lone</webui-button>');
    // The clicks and the submit event are synchronous, so the count is final when this returns.
    const submitted = await root.evaluate(r => {
        let submits = 0;
        const form = r.querySelector('form');
        form.addEventListener('submit', ev => { ev.preventDefault(); submits++; });
        form.querySelector('webui-button').click();
        r.querySelector(':scope > webui-button').click();
        return submits;
    });
    expect(submitted).toBe(1);
});
test('a form reset leaves data-value buttons working', async ({ page }) => {
    const root = await mount(page, '<form><webui-button data-trigger="btn-r" data-value="9">x</webui-button></form>');
    await root.locator('form').evaluate(f => f.reset());
    await root.locator('webui-button').click();
    await expect.poll(() => page.evaluate(() => webui.getData('btn-r'))).toBe('9');
});
test('it is a button that keyboard users can reach and press', async ({ page }) => {
    const root = await mount(page, '<input id="before"><webui-button label="Go"></webui-button>');
    const button = root.locator('webui-button');
    await expect(button).toHaveAttribute('role', 'button');
    await expect(button).toHaveAttribute('tabindex', '0');
    await button.evaluate(el => { window.__clicks = 0; el.addEventListener('click', () => window.__clicks++); });
    await root.locator('#before').focus();
    await page.keyboard.press('Tab');
    await expect(button).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await expect.poll(() => page.evaluate(() => window.__clicks)).toBe(2);
    await expect(page.getByRole('button', { name: 'Go' })).toHaveCount(1);
});
test('a disabled button is announced as disabled and cannot be pressed from the keyboard', async ({ page }) => {
    const root = await mount(page, '<webui-button label="Go" disabled></webui-button>');
    const button = root.locator('webui-button');
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).toHaveAttribute('tabindex', '-1');
    // The key is sent straight to the button, since a disabled one cannot take focus. Handling it is synchronous,
    // so the count is final when each call returns.
    const press = () => button.evaluate(el => {
        window.__clicks ??= 0;
        if (!el.__counted) { el.__counted = true; el.addEventListener('click', () => window.__clicks++); }
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        return window.__clicks;
    });
    const whileDisabled = await press();
    expect(whileDisabled).toBe(0);
    await button.evaluate(el => el.removeAttribute('disabled'));
    await expect(button).not.toHaveAttribute('aria-disabled');
    await expect(button).toHaveAttribute('tabindex', '0');
    // The same key presses it once enabled.
    const onceEnabled = await press();
    expect(onceEnabled).toBe(1);
});
test('a button with a target, or clicked with Ctrl, opens its href in another window', async ({ page }) => {
    const root = await mount(page, '<webui-button id="t" href="/contact" target="_blank">T</webui-button><webui-button id="o" href="https://example.com/x">O</webui-button><webui-button id="d" href="https://example.com/x" disabled>D</webui-button>');
    const opened = await root.evaluate(r => {
        const calls = [];
        window.open = (...args) => { calls.push(args); return null; };
        r.querySelector('#t').click();
        r.querySelector('#o').dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true, ctrlKey: true }));
        r.querySelector('#d').click();
        return calls;
    });
    expect(opened).toEqual([['/contact', '_blank', 'noopener'], ['https://example.com/x', '_blank', 'noopener']]);
    await expect(page).not.toHaveURL(/example\.com|contact/);
});
test('a button with an href is a link, and a role or tabindex set on it is kept', async ({ page }) => {
    const root = await mount(page, '<webui-button id="a" href="/x" label="A"></webui-button><webui-button id="b" role="tab" tabindex="-1" label="B"></webui-button>');
    await expect(root.locator('#a')).toHaveAttribute('role', 'link');
    await expect(root.locator('#b')).toHaveAttribute('role', 'tab');
    await expect(root.locator('#b')).toHaveAttribute('tabindex', '-1');
});
test('icon-only shows just the icon, named by its text', async ({ page }) => {
    const root = await mount(page, '<webui-button id="a" icon-only start-icon="gear">Settings</webui-button><webui-button id="c" icon-only start-icon="home" aria-label="Go home">Home</webui-button>');
    await expect(root.locator('#a')).toHaveAttribute('collapsed', '');
    await expect(root.getByRole('button', { name: 'Settings' })).toHaveAttribute('aria-label', 'Settings');
    await expect(root.locator('#a').locator('.initials')).toHaveText('');
    // A name the page gave it is kept.
    await expect(root.locator('#c')).toHaveAttribute('aria-label', 'Go home');
});
test('icon-only follows its text, and turning it off shows the text again without the added name', async ({ page }) => {
    const root = await mount(page, '<webui-button icon-only start-icon="gear">Settings</webui-button>');
    const button = root.locator('webui-button');
    await expect(button).toHaveAttribute('aria-label', 'Settings');
    await button.evaluate(el => { [...el.childNodes].find(node => node.nodeType === Node.TEXT_NODE).data = 'Options'; });
    await expect(button).toHaveAttribute('aria-label', 'Options');
    await button.evaluate(el => el.removeAttribute('icon-only'));
    await expect(button).not.toHaveAttribute('collapsed');
    await expect(button).not.toHaveAttribute('aria-label');
});
test('icon-only without an icon shows two letters of its text in place of one', async ({ page }) => {
    const root = await mount(page, `<webui-button icon-only>Projects</webui-button><webui-button icon-only>Security Key</webui-button>
<webui-button icon-only>Remote Desktop Connections</webui-button><webui-button icon-only>remote-desktop</webui-button>`);
    const buttons = root.locator('webui-button');
    await expect(buttons.locator('.initials')).toHaveText(['Pr', 'SK', 'RD', 'RD']);
    await expect(root.getByRole('button', { name: 'Security Key' })).toHaveAttribute('collapsed', '');
    // The letters stand in for an icon, so screen readers hear the name, not the letters.
    await expect(buttons.first().locator('.initials')).toHaveAttribute('aria-hidden', 'true');
    // Turned off, it shows its text, and the letters go.
    await buttons.first().evaluate(el => el.removeAttribute('icon-only'));
    await expect(buttons.first().locator('.initials')).toHaveText('');
    await expect(buttons.first()).not.toHaveAttribute('initials');
});
test('icon-only with no text yet shows nothing until text arrives', async ({ page }) => {
    const root = await mount(page, '<webui-button icon-only></webui-button>');
    const button = root.locator('webui-button');
    await expect(button).toHaveAttribute('role', 'button');
    await expect(button).not.toHaveAttribute('collapsed');
    await button.evaluate(el => { el.textContent = 'Billing'; });
    await expect(button.locator('.initials')).toHaveText('Bi');
    await expect(button).toHaveAttribute('aria-label', 'Billing');
});
