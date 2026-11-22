import { test, expect, mount } from '../support/webui.mjs';

test('shows a focus ring around the box while typing', async ({ page }) => {
    const root = await mount(page, '<webui-input-message label="Note"></webui-input-message>');
    const el = root.locator('webui-input-message');
    await el.locator('textarea').focus();
    // An accessibility rule, so the ring itself is checked (Websites/CLAUDE.md, What tests check).
    await expect.poll(() => el.evaluate(e => getComputedStyle(e).outlineWidth)).toBe('2px');
});
test('typed text stays readable on the box when the page uses a dark color scheme', async ({ page }) => {
    // A dark color-scheme turns a textarea's default text white, which can't be read on the box's light paper.
    // This checks the WCAG AA contrast of the typed text against the box, the accessibility check tests keep.
    const root = await mount(page, '<webui-input-message value="Commit message"></webui-input-message>');
    await page.evaluate(() => { document.documentElement.style.colorScheme = 'dark'; });
    const el = root.locator('webui-input-message');
    await expect(el.locator('textarea')).toHaveValue('Commit message');
    const ratio = await el.evaluate(host => {
        const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
        const luminance = ([r, g, b]) => [r, g, b].map(c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; })
            .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
        const text = luminance(rgb(getComputedStyle(host.shadowRoot.querySelector('textarea')).color));
        const box = luminance(rgb(getComputedStyle(host).backgroundColor));
        return (Math.max(text, box) + 0.05) / (Math.min(text, box) + 0.05);
    });
    expect(ratio).toBeGreaterThanOrEqual(4.5);
});
test('disabled turns the box off, and removing it turns it on again', async ({ page }) => {
    const root = await mount(page, '<webui-input-message value="a" disabled></webui-input-message>');
    const el = root.locator('webui-input-message');
    await expect(el.locator('textarea')).toBeDisabled();
    await el.evaluate(c => c.removeAttribute('disabled'));
    await expect(el.locator('textarea')).toBeEnabled();
});
