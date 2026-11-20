import { test, expect, mount } from '../support/webui.mjs';

test('shows the value, label, and description', async ({ page }) => {
    const root = await mount(page, '<webui-stat value="100 ms" label="Per request"><p id="text">Every request, every report.</p></webui-stat>');
    const stat = root.locator('webui-stat');
    await expect(stat.locator('.value')).toHaveText('100 ms');
    await expect(stat.locator('.label')).toHaveText('Per request');
    await expect(stat.locator('.label')).toBeVisible();
    await expect(root.locator('#text')).toBeVisible();
});

test('without a label, the label is hidden', async ({ page }) => {
    const root = await mount(page, '<webui-stat value="2x"></webui-stat>');
    await expect(root.locator('webui-stat .label')).toBeHidden();
});

