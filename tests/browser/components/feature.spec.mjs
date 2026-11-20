import { test, expect, mount } from '../support/webui.mjs';
import { readFileSync } from 'node:fs';

const clip = readFileSync(new URL('../../fixtures/loop.webm', import.meta.url));
const poster = readFileSync(new URL('../../fixtures/loop-poster.png', import.meta.url));
const serveMedia = page => Promise.all([
    page.route('**/test-media/loop.webm', route => route.fulfill({ contentType: 'video/webm', body: clip })),
    page.route('**/test-media/shot.png', route => route.fulfill({ contentType: 'image/png', body: poster })),
]);
const shot = root => root.locator('webui-feature a.shot');
const loop = root => root.locator('webui-feature webui-loop-video');

test('video shows a looping clip with the screenshot as its poster', async ({ page }) => {
    await serveMedia(page);
    const root = await mount(page, '<webui-feature src="/test-media/shot.png" video="/test-media/loop.webm" alt="Building a page"><p>Text</p></webui-feature>');
    await expect(shot(root)).toBeHidden();
    await expect(loop(root)).toBeVisible();
    await expect(loop(root)).toHaveAttribute('poster', '/test-media/shot.png');
    await expect(loop(root)).toHaveAttribute('alt', 'Building a page');
    await expect.poll(() => loop(root).locator('video').evaluate(v => !v.paused)).toBe(true);
});

