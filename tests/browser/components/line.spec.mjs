import { test, expect, mount } from '../support/webui.mjs';

// Not a particular color, only that the line isn't see-through, which would leave nothing to see.
test('the line can be seen', async ({ page }) => {
    const root = await mount(page, '<webui-line></webui-line>');
    await expect.poll(() => root.locator('webui-line div').evaluate(d => getComputedStyle(d).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
});
