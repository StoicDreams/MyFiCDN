import { test, expect, mount } from '../support/webui.mjs';

// Where alerts go needs real layout: an alert moves into a panel only while the panel is in view.
test('an alert that pops up while a panel is in view moves into the top of the panel, and stays there', async ({ page }) => {
    const root = await mount(page, '<webui-alerts hidden></webui-alerts><webui-alerts id="p" panel style="display:block;width:400px"></webui-alerts>');
    const panel = root.locator('#p');
    await page.evaluate(() => webui.addAlert('Earlier', 'info', { popup: false }));
    await expect(panel.locator('.alerts-list > webui-alert')).toHaveText(['Earlier']);
    await page.evaluate(() => webui.alert('Just now', 'success'));
    // It pops up first, where alerts appear, then takes its place at the top of the list.
    await expect(page.locator('.webui-alerts-popup webui-alert', { hasText: 'Just now' })).toBeVisible();
    await expect(panel.locator('.alerts-list > webui-alert')).toHaveText(['Just now', 'Earlier']);
    await expect(panel.locator('webui-alert', { hasText: 'Just now' })).toBeVisible();
    await expect(page.locator('.webui-alerts-popup webui-alert')).toHaveCount(0);
});
test('an alert that pops up while no panel is in view stays in its popup', async ({ page }) => {
    const root = await mount(page, '<webui-alerts hidden></webui-alerts><div style="display:none"><webui-alerts id="p" panel></webui-alerts></div>');
    await page.evaluate(() => webui.alert('Popup only', 'info'));
    const popup = page.locator('.webui-alerts-popup webui-alert', { hasText: 'Popup only' });
    await expect(popup).toBeVisible();
    // It hides once its time is up, still in the popup, having never moved into the panel.
    await expect(popup).toBeHidden();
    await expect(popup).toHaveCount(1);
    await expect(root.locator('#p .alerts-list > webui-alert', { hasText: 'Popup only' })).toHaveCount(0);
});
