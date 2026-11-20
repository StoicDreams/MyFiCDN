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
    await expect(root.locator('webui-dialogs form')).toContainText('Listed');
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
    await expect.poll(() => page.evaluate(() => window.__clicks)).toBe(1);
    // Enter opens a dialog, which takes focus, so Space is sent to the control directly.
    await el.evaluate(c => c.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })));
    await expect.poll(() => page.evaluate(() => window.__clicks)).toBe(2);
});

test('webui.addAlert resolves to the alert, which says when the user closes it', async ({ page }) => {
    await ready(page);
    // webui.alert is often a .catch handler whose result is tested, so it still resolves to nothing.
    const plain = await page.evaluate(async () => (await webui.alert('Plain', 'info')) === undefined);
    expect(plain).toBe(true);
    const closed = await page.evaluate(async () => {
        const alert = await webui.addAlert('Close me', 'info');
        window.__closed = 0;
        alert.addEventListener('close', () => window.__closed++);
        return alert.tagName;
    });
    expect(closed).toBe('WEBUI-ALERT');
    await popup(page).locator('webui-alert', { hasText: 'Close me' }).locator('#close').click();
    await expect.poll(() => page.evaluate(() => window.__closed)).toBe(1);
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
    await expect.poll(() => page.evaluate(() => window.__closedQuietly)).toBeUndefined();
});
test('webui.clearAlerts removes every alert from the popup and the list', async ({ page }) => {
    const root = await mount(page, '<webui-dialogs></webui-dialogs><webui-alerts></webui-alerts>');
    await page.evaluate(async () => {
        await webui.alert('First', 'info');
        await webui.alert('Second', 'warning');
        await webui.addAlert('Third', 'info', { popup: false });
        window.__closed = 0;
        document.addEventListener('close', () => window.__closed++);
    });
    await expect(root.locator('webui-alerts webui-icon')).toHaveAttribute('count', '3');
    await page.evaluate(() => webui.clearAlerts());
    await expect(popup(page).locator('webui-alert')).toHaveCount(0);
    await expect(root.locator('webui-alerts webui-icon')).toHaveAttribute('count', '');
    // Cleared quietly by default, so nothing is marked as closed by the user.
    await expect.poll(() => page.evaluate(() => window.__closed)).toBe(0);
    await root.locator('webui-alerts').click();
    await expect(root.locator('webui-dialogs form')).toContainText('You have no alerts at this time.');
});
test('webui.clearAlerts with close true fires close on each alert', async ({ page }) => {
    await ready(page);
    await page.evaluate(async () => {
        window.__closed = [];
        for (const text of ['One', 'Two']) {
            const alert = await webui.addAlert(text, 'info');
            alert.addEventListener('close', () => window.__closed.push(text));
        }
        webui.clearAlerts({ close: true });
    });
    await expect.poll(() => page.evaluate(() => window.__closed)).toEqual(['One', 'Two']);
    await expect(popup(page).locator('webui-alert')).toHaveCount(0);
});
test('alerts added after webui.clearAlerts show again', async ({ page }) => {
    const root = await ready(page);
    await page.evaluate(async () => { await webui.alert('Again', 'info'); webui.clearAlerts(); await webui.alert('Again', 'info'); });
    await expect(popup(page).locator('webui-alert')).toHaveText('Again');
    await expect(popup(page).locator('.counter')).toHaveCount(0);
    await expect(root.locator('webui-alerts webui-icon')).toHaveAttribute('count', '1');
});
test('with panel it lists the alerts in place, and follows them as they come and go', async ({ page }) => {
    const root = await mount(page, '<webui-alerts hidden></webui-alerts><webui-alerts id="p" panel></webui-alerts>');
    const panel = root.locator('#p');
    await expect(panel).toContainText('You have no alerts at this time.');
    await page.evaluate(() => webui.addAlert('In the panel', 'info', { popup: false }));
    await expect(panel.locator('webui-alert')).toHaveText('In the panel');
    await page.evaluate(() => webui.clearAlerts());
    await expect(panel).toContainText('You have no alerts at this time.');
    // A panel is not a button.
    await expect(panel).not.toHaveAttribute('role');
});
test('the document hears each change in how many alerts there are', async ({ page }) => {
    await ready(page);
    await page.evaluate(() => {
        window.__counts = [];
        document.addEventListener('webui-alerts-count', ev => window.__counts.push(ev.detail.count));
    });
    await page.evaluate(async () => { await webui.alert('One', 'info'); await webui.alert('Two', 'info'); });
    await page.evaluate(() => webui.clearAlerts());
    await expect.poll(() => page.evaluate(() => window.__counts)).toEqual([1, 2, 0]);
});
test('a panel lists the newest alert first, and Clear All closes them all', async ({ page }) => {
    const root = await mount(page, '<webui-alerts hidden></webui-alerts><webui-alerts id="p" panel></webui-alerts>');
    const panel = root.locator('#p');
    const clearAll = panel.locator('webui-button', { hasText: 'Clear All' });
    await expect(clearAll).toBeHidden();
    await page.evaluate(async () => {
        window.__closed = [];
        for (const text of ['Older', 'Newer']) {
            const alert = await webui.addAlert(text, 'info', { popup: false });
            alert.addEventListener('close', () => window.__closed.push(text));
        }
    });
    await expect(panel.locator('.alerts-list > webui-alert')).toHaveText(['Newer', 'Older']);
    await clearAll.click();
    await expect.poll(() => page.evaluate(() => window.__closed)).toEqual(['Older', 'Newer']);
    await expect(panel.locator('.alerts-list > webui-alert')).toHaveText(['You have no alerts at this time.']);
    await expect(clearAll).toBeHidden();
    await expect(root.locator('webui-alerts[hidden] webui-icon')).toHaveAttribute('count', '');
});
test('closing an alert in a panel removes only that one, leaving the others in place', async ({ page }) => {
    const root = await mount(page, '<webui-alerts hidden></webui-alerts><webui-alerts id="p" panel></webui-alerts>');
    const panel = root.locator('#p');
    await page.evaluate(async () => {
        for (const text of ['One', 'Two', 'Three']) await webui.addAlert(text, 'info', { popup: false });
    });
    await expect(panel.locator('.alerts-list > webui-alert')).toHaveText(['Three', 'Two', 'One']);
    // The others are never taken out and put back, which replays their entrance and makes them flash.
    await page.evaluate(() => {
        window.__moved = [];
        new MutationObserver(records => records.forEach(record => record.removedNodes.forEach(node => window.__moved.push(node.textContent.trim()))))
            .observe(document.querySelector('#p .alerts-list'), { childList: true });
    });
    await panel.locator('webui-alert', { hasText: 'Two' }).locator('#close').click();
    await expect(panel.locator('.alerts-list > webui-alert')).toHaveText(['Three', 'One']);
    expect(await page.evaluate(() => window.__moved)).toEqual(['Two']);
    await expect(root.locator('webui-alerts[hidden] webui-icon')).toHaveAttribute('count', '2');
});
