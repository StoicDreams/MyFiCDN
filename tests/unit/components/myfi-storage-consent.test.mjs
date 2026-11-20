import { test, expect, mount } from '../support/webui.mjs';

const consent = async page => {
    const root = await mount(page, '<webui-myfi-storage-consent></webui-myfi-storage-consent>');
    const el = root.locator('webui-myfi-storage-consent');
    await expect(el.locator('webui-card')).toHaveCount(2);
    return el;
};

test('offers session and long term storage', async ({ page }) => {
    const el = await consent(page);
    await expect(el.locator('webui-card').first()).toContainText('Single Session');
    await expect(el.locator('webui-card').nth(1)).toContainText('Long-term Storage');
});
test('session storage is marked as the current choice by default', async ({ page }) => {
    const el = await consent(page);
    await expect(el.locator('webui-card').first()).toHaveAttribute('theme', 'active');
});
test('accepting long term storage moves data to local storage', async ({ page }) => {
    const el = await consent(page);
    await page.evaluate(() => webui.storage.setItem('consent-kept', 'yes'));
    await el.locator('webui-card').nth(1).locator('webui-button').evaluate(b => b.click());
    await expect.poll(() => page.evaluate(() => localStorage.getItem('consent-kept'))).toBe('yes');
    await expect.poll(() => el.locator('webui-card').nth(1).getAttribute('theme')).toBe('active');
});
test('accepting session storage clears local storage', async ({ page }) => {
    const el = await consent(page);
    await page.evaluate(() => webui.storage.acceptLocalStorage());
    await el.locator('webui-card').first().locator('webui-button').evaluate(b => b.click());
    await expect.poll(() => page.evaluate(() => localStorage.getItem('storage_accepted'))).toBeNull();
});
test('its headings do not skip levels', async ({ page }) => {
    const el = await consent(page);
    // Its option labels were h6 headings under its h2 title, which screen readers announce as missing levels.
    await expect(el.locator('h3, h4, h5, h6')).toHaveCount(0);
    await expect(el.locator('strong', { hasText: 'Use this option when:' })).toBeAttached();
});
