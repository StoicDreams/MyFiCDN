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
