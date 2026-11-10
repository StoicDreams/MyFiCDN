import { test, expect, mount } from '../support/webui.mjs';

test('assigns an id and shows dock and move controls', async ({ page }) => {
    const root = await mount(page, '<webui-drawer slot="left" data-dockable data-moveable docked="true"></webui-drawer>');
    const drawer = root.locator('webui-drawer');
    await expect(drawer).toHaveAttribute('id', /^d[0-9a-f]+$/);
    await expect(drawer.locator('[slot="footer"] .toggle-pos-right')).toHaveCount(1);
    await expect(drawer.locator('[slot="footer"] webui-toggle-icon')).toHaveCount(1);
});
test('move buttons change the slot', async ({ page }) => {
    const root = await mount(page, '<webui-drawer slot="left" data-moveable></webui-drawer>');
    const drawer = root.locator('webui-drawer');
    await expect(drawer).toHaveAttribute('id', /./);
    await drawer.locator('.toggle-pos-right').evaluate(el => el.click());
    await expect(drawer).toHaveAttribute('slot', 'right');
});
test('the footer is rebuilt when content replaces it', async ({ page }) => {
    const root = await mount(page, '<webui-drawer data-moveable></webui-drawer>');
    const drawer = root.locator('webui-drawer');
    await expect(drawer.locator('[slot="footer"]')).toHaveCount(1);
    await drawer.evaluate(el => { el.innerHTML = '<p>New</p>'; });
    await expect(drawer.locator('p')).toHaveText('New');
    await expect(drawer.locator('[slot="footer"]')).toHaveCount(1);
});
test('narrow windows undock it, and wide windows restore it', async ({ page }) => {
    const root = await mount(page, '<webui-drawer data-dockable docked="true"></webui-drawer>');
    const drawer = root.locator('webui-drawer');
    await expect(drawer).toHaveAttribute('docked', 'true');
    await page.setViewportSize({ width: 600, height: 700 });
    await expect(drawer).not.toHaveAttribute('docked');
    await expect(drawer.locator('[slot="footer"] webui-toggle-icon')).toHaveCount(0);
    await page.setViewportSize({ width: 1300, height: 700 });
    await expect(drawer).toHaveAttribute('docked', 'true');
});
test('the open class slides an undocked drawer into view', async ({ page }) => {
    const root = await mount(page, '<webui-drawer style="transition:none">Body</webui-drawer>');
    const drawer = root.locator('webui-drawer');
    await expect(drawer).not.toBeInViewport();
    await drawer.evaluate(el => el.classList.add('open'));
    await expect(drawer).toBeInViewport();
});
test('is a labelled landmark, named Menu when it holds the site menu', async ({ page }) => {
    const root = await mount(page, '<webui-drawer id="menu" slot="left" class="nav"><webui-nav></webui-nav></webui-drawer><webui-drawer id="panel" slot="right" class="shared"></webui-drawer>');
    await expect(root.getByRole('complementary', { name: 'Menu' })).toBeAttached();
    await expect(root.getByRole('complementary', { name: 'Side panel' })).toBeAttached();
});
test('dock and move controls name the menu navigation, and any other drawer a panel', async ({ page }) => {
    const root = await mount(page, '<webui-drawer slot="left" class="nav" data-dockable data-moveable docked="true"><webui-nav></webui-nav></webui-drawer><webui-drawer slot="right" class="shared" data-dockable data-moveable docked="true"></webui-drawer>');
    // The drawer replaces any id with its own, so these are found by class.
    const menu = root.locator('webui-drawer.nav > [slot="footer"]');
    const panel = root.locator('webui-drawer.shared > [slot="footer"]');
    await expect(menu.locator('webui-toggle-icon')).toHaveAttribute('title-on', 'Hide Navigation');
    await expect(menu.locator('webui-toggle-icon')).toHaveAttribute('title-off', 'Dock Navigation');
    await expect(menu.locator('.toggle-pos-right')).toHaveAttribute('aria-label', 'Set navigation to right');
    await expect(panel.locator('webui-toggle-icon')).toHaveAttribute('title-on', 'Hide Panel');
    await expect(panel.locator('webui-toggle-icon')).toHaveAttribute('title-off', 'Dock Panel');
    await expect(panel.locator('.toggle-pos-left')).toHaveAttribute('aria-label', 'Set panel to left');
});
