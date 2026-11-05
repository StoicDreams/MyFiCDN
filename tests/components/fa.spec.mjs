import { test, expect, mount } from '../support/webui.mjs';

test('count displays in its slot', async ({ page }) => {
    const root = await mount(page, '<webui-fa count="1200"></webui-fa>');
    await expect(root.locator('webui-fa slot[name="count"]')).toHaveText('1,200');
});
test('icon updates are safe while icon loading is not implemented', async ({ page }) => {
    const root = await mount(page, '<webui-fa icon="star" family="regular"></webui-fa>');
    const el = root.locator('webui-fa');
    await expect(el.locator('slot[name="icon"]')).toHaveText('');
    await el.evaluate(c => c.setAttribute('icon', 'moon'));
    expect(await el.evaluate(c => c.icon)).toBe('moon');
});
