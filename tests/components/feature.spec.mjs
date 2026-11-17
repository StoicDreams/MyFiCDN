import { test, expect, mount } from '../support/webui.mjs';
import { readFileSync } from 'node:fs';

const clip = readFileSync(new URL('../fixtures/loop.webm', import.meta.url));
const poster = readFileSync(new URL('../fixtures/loop-poster.png', import.meta.url));
const serveMedia = page => Promise.all([
    page.route('**/test-media/loop.webm', route => route.fulfill({ contentType: 'video/webm', body: clip })),
    page.route('**/test-media/shot.png', route => route.fulfill({ contentType: 'image/png', body: poster })),
]);
const shot = root => root.locator('webui-feature a.shot');
const loop = root => root.locator('webui-feature webui-loop-video');

test('shows a screenshot linked to its full size', async ({ page }) => {
    await serveMedia(page);
    const root = await mount(page, '<div style="width:1000px"><webui-feature src="/test-media/shot.png" alt="The dashboard"><h3 id="text">Dashboard</h3></webui-feature></div>');
    await expect(shot(root)).toBeVisible();
    await expect(shot(root)).toHaveAttribute('href', /\/test-media\/shot\.png$/);
    await expect(shot(root)).toHaveAttribute('aria-label', 'The dashboard (full size)');
    await expect(root.locator('webui-feature a.shot img')).toHaveAttribute('alt', 'The dashboard');
    await expect(loop(root)).toBeHidden();
    // How the screenshot sits beside the text is checked by eye.
});

test('href links the screenshot somewhere else', async ({ page }) => {
    await serveMedia(page);
    const root = await mount(page, '<webui-feature src="/test-media/shot.png" alt="Ap Tul" href="https://www.aptul.com"><p>Text</p></webui-feature>');
    await expect(shot(root)).toHaveAttribute('href', 'https://www.aptul.com');
    await expect(shot(root)).toHaveAttribute('aria-label', 'Ap Tul');
});

test('video shows a looping clip with the screenshot as its poster', async ({ page }) => {
    await serveMedia(page);
    const root = await mount(page, '<webui-feature src="/test-media/shot.png" video="/test-media/loop.webm" alt="Building a page"><p>Text</p></webui-feature>');
    await expect(shot(root)).toBeHidden();
    await expect(loop(root)).toBeVisible();
    await expect(loop(root)).toHaveAttribute('poster', '/test-media/shot.png');
    await expect(loop(root)).toHaveAttribute('alt', 'Building a page');
    await expect.poll(() => loop(root).locator('video').evaluate(v => !v.paused)).toBe(true);
});

test('media in the media slot replaces the screenshot and clip', async ({ page }) => {
    await serveMedia(page);
    const root = await mount(page, '<webui-feature src="/test-media/shot.png" video="/test-media/loop.webm"><div slot="media" id="custom" style="height:50px">Custom</div><p>Text</p></webui-feature>');
    await expect(root.locator('#custom')).toBeVisible();
    await expect(shot(root)).toBeHidden();
    await expect(loop(root)).toBeHidden();
});

