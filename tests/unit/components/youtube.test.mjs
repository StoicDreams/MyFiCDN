import { test, expect, mount } from '../support/webui.mjs';

const frame = root => root.locator('webui-youtube iframe');

test('embeds the video in privacy-enhanced mode with a title', async ({ page }) => {
    const root = await mount(page, '<webui-youtube video="Gn99fCoEPdM" label="Engine intro"></webui-youtube>');
    await expect(frame(root)).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/Gn99fCoEPdM');
    await expect(frame(root)).toHaveAttribute('title', 'Engine intro');
    await expect(frame(root)).toHaveAttribute('loading', 'lazy');
});
test('start adds a start time, and changing the video updates the frame', async ({ page }) => {
    const root = await mount(page, '<webui-youtube video="Gn99fCoEPdM" start="42"></webui-youtube>');
    await expect(frame(root)).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/Gn99fCoEPdM?start=42');
    await expect(frame(root)).toHaveAttribute('title', 'YouTube video');
    await root.locator('webui-youtube').evaluate(el => { el.setAttribute('start', ''); el.setAttribute('video', 'IVPHtC0H2fU'); });
    await expect(frame(root)).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/IVPHtC0H2fU');
});
test('a video id that is not valid shows nothing', async ({ page }) => {
    const root = await mount(page, '<webui-youtube video="../../evil?x=1"></webui-youtube>');
    await expect(frame(root)).toBeHidden();
    await expect.poll(() => frame(root).getAttribute('src')).toBeNull();
});
