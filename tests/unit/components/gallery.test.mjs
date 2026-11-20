import { test, expect, mount } from '../support/webui.mjs';

test('shows the first image and switches when a card is clicked', async ({ page }) => {
    await page.route('**/gallery-test.json', route => route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([{ name: 'One', src: '/a.png' }, { name: 'Two', src: '/b.png' }]),
    }));
    const root = await mount(page, '<webui-gallery src="/gallery-test.json" card-width="100"></webui-gallery>');
    const image = root.locator('webui-flex img');
    await expect(image).toHaveAttribute('src', '/a.png');
    await expect(root.locator('webui-cards webui-card')).toHaveCount(2);
    await expect(root.locator('webui-flex p')).toHaveText('One');
    await root.locator('webui-card').nth(1).evaluate(card => card.click());
    await expect(image).toHaveAttribute('src', '/b.png');
    await expect(root.locator('webui-flex p')).toHaveText('Two');
});
test('an empty or failed source shows nothing', async ({ page }) => {
    await page.route('**/gallery-empty.json', route => route.fulfill({ contentType: 'application/json', body: '[]' }));
    const root = await mount(page, '<webui-gallery src="/gallery-empty.json"><i></i></webui-gallery><webui-gallery src="/missing.json"><i></i></webui-gallery>');
    // A gallery with nothing to show empties itself once its source has answered, which removes the markers.
    await expect(root.locator('webui-gallery i')).toHaveCount(0);
    await expect(root.locator('webui-cards')).toHaveCount(0);
});
test('the shown image is described by its name', async ({ page }) => {
    await page.route('**/gallery-test.json', route => route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([{ name: 'Kitchen render', src: '/a.png' }, { name: 'Two', src: '/b.png' }]),
    }));
    const root = await mount(page, '<webui-gallery src="/gallery-test.json" card-width="100"></webui-gallery>');
    await expect(root.locator('webui-flex img')).toHaveAttribute('alt', 'Kitchen render');
});
test('shows the images and videos written inside it, in their place', async ({ page }) => {
    const root = await mount(page, `<webui-gallery card-width="100">
<img src="/a.png" alt="Home page">
<video src="/clip.mp4" poster="/clip.webp" title="Saving a file"></video>
<webui-loop-video src="/loop.mp4" alt="A loop"></webui-loop-video>
</webui-gallery>`);
    const gallery = root.locator('webui-gallery');
    await expect(gallery.locator('webui-card')).toHaveCount(3);
    await expect(gallery.locator(':scope > img, :scope > video, :scope > webui-loop-video')).toHaveCount(0);
    await expect(gallery.locator('webui-flex img')).toHaveAttribute('src', '/a.png');
    await expect(gallery.locator('webui-flex p')).toHaveText('Home page');
    await gallery.getByRole('button', { name: 'Saving a file' }).click();
    const video = gallery.locator('webui-flex video');
    await expect(video).toHaveAttribute('src', '/clip.mp4');
    await expect(video).toHaveAttribute('poster', '/clip.webp');
    await expect(video).toBeVisible();
    await expect(gallery.locator('webui-flex img')).toBeHidden();
    await expect(gallery.locator('webui-flex p')).toHaveText('Saving a file');
});
test('a video from JSON plays in the viewer, with its poster as the card', async ({ page }) => {
    await page.route('**/gallery-video.json', route => route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([{ name: 'Clip', src: '/clip.mp4', poster: '/clip.webp' }, { name: 'Forced', src: '/stream', type: 'video' }]),
    }));
    const root = await mount(page, '<webui-gallery src="/gallery-video.json"></webui-gallery>');
    await expect(root.locator('webui-flex video')).toHaveAttribute('src', '/clip.mp4');
    await expect(root.locator('webui-flex video')).toHaveAttribute('controls', '');
    await expect.poll(() => root.locator('webui-card').first().locator('div').first().evaluate(div => div.style.backgroundImage)).toContain('/clip.webp');
    await root.getByRole('button', { name: 'Forced' }).click();
    await expect(root.locator('webui-flex video')).toHaveAttribute('src', '/stream');
});
test('galleries on one page each keep their own selection', async ({ page }) => {
    const root = await mount(page, `<webui-gallery id="g1"><img src="/a.png" alt="A"><img src="/b.png" alt="B"></webui-gallery>
<webui-gallery id="g2"><img src="/c.png" alt="C"><img src="/d.png" alt="D"></webui-gallery>`);
    await root.locator('#g1').getByRole('button', { name: 'B' }).click();
    await expect(root.locator('#g1 webui-flex img')).toHaveAttribute('src', '/b.png');
    await expect(root.locator('#g2 webui-flex img')).toHaveAttribute('src', '/c.png');
});
test('cards are buttons that Enter and Space choose', async ({ page }) => {
    const root = await mount(page, '<webui-gallery><img src="/a.png" alt="A"><img src="/b.png" alt="B"><img src="/c.png" alt="C"></webui-gallery>');
    const b = root.getByRole('button', { name: 'B' });
    await expect(root.getByRole('button', { name: 'A' })).toHaveAttribute('aria-pressed', 'true');
    await b.focus();
    await page.keyboard.press('Enter');
    await expect(root.locator('webui-flex img')).toHaveAttribute('src', '/b.png');
    await expect(b).toHaveAttribute('aria-pressed', 'true');
    await root.getByRole('button', { name: 'C' }).focus();
    await page.keyboard.press(' ');
    await expect(root.locator('webui-flex img')).toHaveAttribute('src', '/c.png');
});
test('names are shown as text', async ({ page }) => {
    const root = await mount(page, '<webui-gallery><img src="/a.png" alt="<b>bold</b>"></webui-gallery>');
    await expect(root.locator('webui-flex p')).toHaveText('<b>bold</b>');
    await expect(root.locator('webui-flex p b')).toHaveCount(0);
});
