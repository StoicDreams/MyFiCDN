import { test, expect, mount } from '../support/webui.mjs';

// webui-badge is a label: it is tested by what it says and the theme it takes, never by how it looks.
test('shows its text, with an icon when it has one', async ({ page }) => {
    const root = await mount(page, '<webui-badge id="b" theme="success" icon="check">Signed</webui-badge>');
    const badge = root.locator('#b');
    await expect(badge).toHaveText('Signed');
    await expect(badge.locator('webui-icon')).toHaveAttribute('icon', 'check');
    await expect(badge.locator('webui-icon')).toBeVisible();
});

test('without an icon it shows only its text, and the icon comes and goes with the attribute', async ({ page }) => {
    const root = await mount(page, '<webui-badge id="b">Turned off</webui-badge>');
    const badge = root.locator('#b');
    await expect(badge.locator('webui-icon')).toBeHidden();
    await badge.evaluate(el => el.setAttribute('icon', 'pause'));
    await expect(badge.locator('webui-icon')).toBeVisible();
    await badge.evaluate(el => el.removeAttribute('icon'));
    await expect(badge.locator('webui-icon')).toBeHidden();
});

test('a theme sets its theme colors, and removing it clears them', async ({ page }) => {
    const root = await mount(page, '<webui-badge id="b" theme="warning">From a folder</webui-badge>');
    const badge = root.locator('#b');
    const theme = () => badge.evaluate(el => el.style.getPropertyValue('--theme-color'));
    await expect.poll(theme).toBe('var(--color-warning)');
    await badge.evaluate(el => el.removeAttribute('theme'));
    await expect.poll(theme).toBe('');
});

test('hidden hides it, as on any element', async ({ page }) => {
    const root = await mount(page, '<webui-badge id="b" hidden>3</webui-badge>');
    await expect(root.locator('#b')).toBeHidden();
    await root.locator('#b').evaluate(el => { el.hidden = false; });
    await expect(root.locator('#b')).toBeVisible();
});
