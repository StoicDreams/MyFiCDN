import { test, expect, mount } from '../support/webui.mjs';

const image = root => root.locator('webui-media img');

test('shows the image beside the content', async ({ page }) => {
    const root = await mount(page, '<div style="width:800px"><webui-media src="/Logo.svg" alt="Logo"><p id="text">Hello</p></webui-media></div>');
    await expect(image(root)).toHaveAttribute('alt', 'Logo');
    expect(await image(root).evaluate(img => img.src)).toContain('/Logo.svg');
    const [img, text] = await Promise.all([image(root), root.locator('#text')].map(l => l.evaluate(el => el.getBoundingClientRect().toJSON())));
    expect(text.left).toBeGreaterThan(img.right);
    expect(Math.round(img.width)).toBe(160);
});
test('stacks the image above the content when narrow', async ({ page }) => {
    const root = await mount(page, '<div style="width:360px"><webui-media src="/Logo.svg"><p id="text">Hello</p></webui-media></div>');
    const [img, text] = await Promise.all([image(root), root.locator('#text')].map(l => l.evaluate(el => el.getBoundingClientRect().toJSON())));
    expect(text.top).toBeGreaterThanOrEqual(img.bottom);
});
test('size, round, and reverse change the image', async ({ page }) => {
    const root = await mount(page, '<div style="width:800px"><webui-media src="/Logo.svg" size="80" round reverse><p id="text">Hello</p></webui-media></div>');
    const style = await image(root).evaluate(img => ({ width: img.getBoundingClientRect().width, radius: getComputedStyle(img).borderRadius }));
    expect(Math.round(style.width)).toBe(80);
    expect(style.radius).toBe('50%');
    const [img, text] = await Promise.all([image(root), root.locator('#text')].map(l => l.evaluate(el => el.getBoundingClientRect().toJSON())));
    expect(img.left).toBeGreaterThan(text.right);
});
test('without a src the image is hidden and has an empty alt', async ({ page }) => {
    const root = await mount(page, '<webui-media><p>Only text</p></webui-media>');
    await expect(image(root)).toBeHidden();
    await expect(image(root)).toHaveAttribute('alt', '');
});
