import { test, expect, mount } from '../support/webui.mjs';
import { readFileSync } from 'node:fs';

// A two second test pattern, so the tests need no file in the CDN itself.
const clip = readFileSync(new URL('../fixtures/loop.webm', import.meta.url));
const poster = readFileSync(new URL('../fixtures/loop-poster.png', import.meta.url));
const serveClip = page => Promise.all([
    page.route('**/test-media/loop.webm', route => route.fulfill({ contentType: 'video/webm', body: clip })),
    page.route('**/test-media/loop.png', route => route.fulfill({ contentType: 'image/png', body: poster })),
    page.route('**/test-media/missing.webm', route => route.fulfill({ status: 404, body: '' })),
]);
const loop = (src = '/test-media/loop.webm') =>
    `<webui-loop-video src="${src}" poster="/test-media/loop.png" alt="Committing a change"></webui-loop-video>`;
const video = root => root.locator('webui-loop-video video');
const isPlaying = root => video(root).evaluate(el => !el.paused);

test('plays muted, on a loop and inline, once it is on screen', async ({ page }) => {
    await serveClip(page);
    const root = await mount(page, loop());
    await expect.poll(() => isPlaying(root)).toBe(true);
    const state = await video(root).evaluate(el => ({ muted: el.muted, loop: el.loop, inline: el.playsInline, label: el.getAttribute('aria-label') }));
    expect(state).toEqual({ muted: true, loop: true, inline: true, label: 'Committing a change' });
});

test('pauses while scrolled out of view, and plays again when back', async ({ page }) => {
    await serveClip(page);
    const root = await mount(page, `<div id="top" style="height:3000px"></div>${loop()}`);
    await page.waitForTimeout(300);
    expect(await isPlaying(root)).toBe(false);
    await root.locator('webui-loop-video').scrollIntoViewIfNeeded();
    await expect.poll(() => isPlaying(root)).toBe(true);
    await root.locator('#top').evaluate(el => el.scrollIntoView());
    await expect.poll(() => isPlaying(root)).toBe(false);
});

test('the viewer can pause it, and it stays paused when it scrolls back into view', async ({ page }) => {
    await serveClip(page);
    const root = await mount(page, `${loop()}<div style="height:3000px"></div><p id="bottom">End</p>`);
    const toggle = root.getByRole('button', { name: 'Pause Committing a change' });
    await expect.poll(() => isPlaying(root)).toBe(true);
    await toggle.click();
    await expect.poll(() => isPlaying(root)).toBe(false);
    await expect(root.getByRole('button', { name: 'Play Committing a change' })).toHaveAttribute('aria-pressed', 'false');
    await root.locator('#bottom').scrollIntoViewIfNeeded();
    await root.locator('webui-loop-video').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    expect(await isPlaying(root)).toBe(false);
    await root.getByRole('button', { name: 'Play Committing a change' }).click();
    await expect.poll(() => isPlaying(root)).toBe(true);
});

test('with reduced motion it shows the poster until the viewer presses Play', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await serveClip(page);
    const root = await mount(page, loop());
    await page.waitForTimeout(400);
    expect(await isPlaying(root)).toBe(false);
    await expect(video(root)).toHaveAttribute('poster', '/test-media/loop.png');
    await root.getByRole('button', { name: 'Play Committing a change' }).click();
    // A viewer's own choice to play is honored.
    await expect.poll(() => isPlaying(root)).toBe(true);
});

test('a video that cannot load shows its poster as an image instead', async ({ page }) => {
    await serveClip(page);
    const root = await mount(page, loop('/test-media/missing.webm'));
    const image = root.locator('webui-loop-video img');
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute('alt', 'Committing a change');
    await expect(video(root)).toBeHidden();
    await expect(root.locator('webui-loop-video button')).toBeHidden();
});
