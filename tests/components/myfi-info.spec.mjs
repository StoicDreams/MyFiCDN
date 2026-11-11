import { test, expect, mount } from '../support/webui.mjs';

const info = async page => {
    const root = await mount(page, '<webui-dialogs></webui-dialogs><webui-drawer class="shared"></webui-drawer><webui-myfi-info><template slot="panel-content"><p>Panel</p></template></webui-myfi-info>');
    return { root, el: root.locator('webui-myfi-info') };
};

test('shows the sign in icon when signed out', async ({ page }) => {
    const { el } = await info(page);
    await expect(el.locator('webui-icon').first()).toHaveAttribute('theme', 'warning');
    await expect.poll(() => el.evaluate(c => c.getAttribute('title') || c.getAttribute('aria-label'))).toContain('Sign-In');
});
test('sign-in-label shows a labeled button while signed out, and only the icon once signed in', async ({ page }) => {
    const root = await mount(page, '<webui-myfi-info sign-in-label="Sign in"></webui-myfi-info>');
    const el = root.locator('webui-myfi-info');
    const label = el.locator('.label');
    await expect(label).toHaveText('Sign in');
    await expect(label).toBeVisible();
    await expect(el).toHaveAttribute('signed-out', '');
    await page.evaluate(() => webui.setData('session-user-role', 1));
    await expect(el).not.toHaveAttribute('signed-out');
    await expect(label).toBeHidden();
});
test('on localhost, clicking simulates sign in and updates the icon', async ({ page }) => {
    const { el } = await info(page);
    await el.evaluate(c => c.click());
    await expect.poll(() => page.evaluate(() => webui.isSignedIn)).toBe(true);
    await expect(el.locator('webui-icon').first()).toHaveAttribute('theme', 'success');
});
test('when signed in, clicking opens the panel with its buttons', async ({ page }) => {
    const { root, el } = await info(page);
    await page.evaluate(() => webui.setData('session-user-role', 1));
    await expect(el.locator('webui-icon').first()).toHaveAttribute('theme', 'success');
    await el.evaluate(c => c.click());
    const drawer = root.locator('webui-drawer.shared');
    await expect(drawer).toHaveClass(/open/);
    await expect(drawer.locator('p')).toHaveText('Panel');
    await expect(drawer.locator('webui-button[name="signout"]')).toBeAttached();
    await expect(drawer.locator('webui-button[name="site-settings"]')).toBeAttached();
    await expect(drawer.locator('webui-button[name="dev"]')).toBeAttached();
});
test('signing out from the panel clears the role', async ({ page }) => {
    const { root, el } = await info(page);
    await page.evaluate(() => {
        webui.setData('session-user-role', 1);
        webui.alert = () => {};
    });
    await el.evaluate(c => c.click());
    const signout = root.locator('webui-drawer.shared webui-button[name="signout"]');
    await expect(signout).toBeAttached();
    await signout.evaluate(b => b.click());
    await expect.poll(() => page.evaluate(() => webui.isSignedIn)).toBe(false);
});
test('exclude hides panel buttons', async ({ page }) => {
    const root = await mount(page, '<webui-drawer class="shared"></webui-drawer><webui-myfi-info exclude="signout|grow"></webui-myfi-info>');
    await page.evaluate(() => webui.setData('session-user-role', 1));
    await root.locator('webui-myfi-info').evaluate(c => c.click());
    const drawer = root.locator('webui-drawer.shared');
    await expect(drawer.locator('webui-button[name="site-settings"]')).toBeAttached();
    await expect(drawer.locator('webui-button[name="signout"]')).toHaveCount(0);
});
test('without a shared drawer it uses a dialog and does not throw', async ({ page }) => {
    const root = await mount(page, '<webui-dialogs></webui-dialogs><webui-myfi-info></webui-myfi-info>');
    await page.evaluate(() => webui.setData('session-user-role', 1));
    await root.locator('webui-myfi-info').evaluate(c => c.click());
    await expect(root.locator('webui-dialogs dialog')).toBeVisible();
});
test('works as a button from the keyboard', async ({ page }) => {
    const root = await mount(page, '<webui-dialogs></webui-dialogs><webui-myfi-info title="Open it"></webui-myfi-info>');
    const el = root.locator('webui-myfi-info');
    await expect(el).toHaveAttribute('role', 'button');
    await expect(el).toHaveAttribute('tabindex', '0');
    await expect(el).toHaveAttribute('aria-label', /.+/);
    await el.evaluate(c => { window.__clicks = 0; c.addEventListener('click', () => window.__clicks++, true); });
    await el.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    expect(await page.evaluate(() => window.__clicks)).toBe(2);
});
