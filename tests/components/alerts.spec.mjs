import { test, expect, mount } from '../support/webui.mjs';

const popup = page => page.locator('.webui-alerts-popup');
const ready = page => mount(page, '<webui-alerts></webui-alerts>');

test('webui.alert shows a popup', async ({ page }) => {
    await ready(page);
    await page.evaluate(() => webui.alert('Saved', 'success'));
    await expect(popup(page).locator('webui-alert')).toHaveText('Saved');
    await expect(popup(page).locator('webui-alert')).toHaveAttribute('variant', 'success');
});
test('repeated alerts share one popup with a counter', async ({ page }) => {
    await ready(page);
    await page.evaluate(async () => { await webui.alert('Same', 'info'); await webui.alert('Same', 'info'); });
    await expect(popup(page).locator('webui-alert')).toHaveCount(1);
    await expect(popup(page).locator('.counter')).toHaveText('2');
});
test('the bell shows the number of alerts', async ({ page }) => {
    const root = await ready(page);
    await page.evaluate(async () => { await webui.alert('One', 'info'); await webui.alert('Two', 'info'); });
    await expect(root.locator('webui-alerts webui-icon')).toHaveAttribute('count', '2');
});
test('alerts can be triggered through data', async ({ page }) => {
    await ready(page);
    await page.evaluate(() => webui.setData('trigger-alert', { message: 'Via data', show: true, variant: 'success' }));
    await expect(popup(page)).toContainText('Via data');
});
test('clicking the bell lists alerts in a dialog', async ({ page }) => {
    const root = await mount(page, '<webui-dialogs></webui-dialogs><webui-alerts data-title="My Alerts"></webui-alerts>');
    await page.evaluate(() => webui.alert('Listed', 'info'));
    await expect(popup(page)).toContainText('Listed');
    await root.locator('webui-alerts').click();
    const dialog = root.locator('webui-dialogs dialog');
    await expect(dialog).toContainText('My Alerts');
    await expect(dialog).toContainText('Listed');
});
test('works as a button from the keyboard', async ({ page }) => {
    const root = await mount(page, '<webui-dialogs></webui-dialogs><webui-alerts title="Open it"></webui-alerts>');
    const el = root.locator('webui-alerts');
    await expect(el).toHaveAttribute('role', 'button');
    await expect(el).toHaveAttribute('tabindex', '0');
    await expect(el).toHaveAttribute('aria-label', /.+/);
    await el.evaluate(c => { window.__clicks = 0; c.addEventListener('click', () => window.__clicks++, true); });
    await el.focus();
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => window.__clicks)).toBe(1);
    // Enter opens a dialog, which takes focus, so Space is sent to the control directly.
    await el.evaluate(c => c.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })));
    expect(await page.evaluate(() => window.__clicks)).toBe(2);
});

test('webui.addAlert resolves to the alert, which says when the user closes it', async ({ page }) => {
    await ready(page);
    // webui.alert is often a .catch handler whose result is tested, so it still resolves to nothing.
    expect(await page.evaluate(async () => (await webui.alert('Plain', 'info')) === undefined)).toBe(true);
    const closed = await page.evaluate(async () => {
        const alert = await webui.addAlert('Close me', 'info');
        window.__closed = 0;
        alert.addEventListener('close', () => window.__closed++);
        return alert.tagName;
    });
    expect(closed).toBe('WEBUI-ALERT');
    await popup(page).locator('webui-alert', { hasText: 'Close me' }).locator('#close').click();
    expect(await page.evaluate(() => window.__closed)).toBe(1);
});
test('popup false adds an alert to the list without a popup, and dismiss removes it quietly', async ({ page }) => {
    const root = await ready(page);
    await page.evaluate(async () => {
        window.__quiet = await webui.addAlert('Quiet one', 'info', { popup: false });
        window.__quiet.addEventListener('close', () => { window.__closedQuietly = true; });
    });
    await expect(popup(page).locator('webui-alert')).toHaveCount(0);
    await expect(root.locator('webui-alerts webui-icon')).toHaveAttribute('count', '1');
    await page.evaluate(() => window.__quiet.dismiss());
    await expect(root.locator('webui-alerts webui-icon')).toHaveAttribute('count', '');
    expect(await page.evaluate(() => window.__closedQuietly)).toBeUndefined();
});
