import { test, expect, mount } from '../support/webui.mjs';

// webui-dropdown in jsdom: what needs layout or the mouse is in tests/browser/components/dropdown.spec.mjs.
test('removing start-icon, mid-icon, or end-icon clears it, rather than naming an icon "null"', async ({ page }) => {
    const root = await mount(page, '<webui-dropdown label="Pick" start-icon="gear" mid-icon="star" end-icon="xmark"></webui-dropdown>');
    const el = root.locator('webui-dropdown');
    await expect(el.locator('webui-icon.start')).toHaveAttribute('icon', 'gear');
    await el.evaluate(c => ['start-icon', 'mid-icon', 'end-icon'].forEach(a => c.removeAttribute(a)));
    for (const part of ['start', 'mid', 'end']) await expect(el.locator(`webui-icon.${part}`)).not.toHaveAttribute('icon');
});
