import { test, expect, mount } from '../support/webui.mjs';

const image = root => root.locator('webui-media img');

// How the image sits beside or above the content, and its size and shape, are checked by eye.
test('shows the image with its alt text', async ({ page }) => {
    const root = await mount(page, '<div style="width:800px"><webui-media src="/Logo.svg" alt="Logo"><p id="text">Hello</p></webui-media></div>');
    await expect(image(root)).toHaveAttribute('alt', 'Logo');
    await expect.poll(() => image(root).evaluate(img => img.src)).toContain('/Logo.svg');
    await expect(image(root)).toBeVisible();
    await expect(root.locator('#text')).toBeVisible();
});
test('without a src the image is hidden and has an empty alt', async ({ page }) => {
    const root = await mount(page, '<webui-media><p>Only text</p></webui-media>');
    await expect(image(root)).toBeHidden();
    await expect(image(root)).toHaveAttribute('alt', '');
});
