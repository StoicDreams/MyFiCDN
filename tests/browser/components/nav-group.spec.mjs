import { test, expect, mount } from '../support/webui.mjs';

test('a closed group takes no room: the item after it follows at once, and its long names never widen the menu', async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 600 });
    const long = 'A very long page name that would make the menu very wide if it counted while hidden';
    const root = await mount(page, `<div style="display:flex;align-items:flex-start">
<webui-nav id="menu" style="display:inline-block">
<webui-nav-group name="Outer">
<webui-nav-group name="Inner"><webui-nav-link name="${long}" url="/x"></webui-nav-link><webui-nav-link name="Two" url="/y"></webui-nav-link></webui-nav-group>
<webui-nav-group name="Inner Two"><webui-nav-link name="Three" url="/z"></webui-nav-link></webui-nav-group>
</webui-nav-group>
<webui-nav-link id="after" name="After" url="/after"></webui-nav-link>
</webui-nav>
<button id="beside">Beside</button>
</div>`);
    const outer = root.locator('webui-nav-group[name="Outer"] > button.navlink');
    await expect(root.locator(`webui-nav-link[name="${long}"]`)).toBeHidden();
    // What a click just below the closed group reaches: the next item, with no gap left by what it holds.
    const box = await outer.boundingBox();
    await expect.poll(() => page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('webui-nav-link, webui-nav-group')?.getAttribute('name') ?? null, { x: box.x + 10, y: box.y + box.height + 6 })).toBe('After');
    // In a narrow window, what sits beside the menu stays in view, rather than pushed out by hidden long names.
    await expect(root.locator('#beside')).toBeInViewport();
    await outer.click();
    await expect(root.locator('webui-nav-group[name="Inner"] > button.navlink')).toBeVisible();
    await expect(root.locator(`webui-nav-link[name="${long}"]`)).toBeHidden();
});
