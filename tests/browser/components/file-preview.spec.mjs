import { test, expect, mount } from '../support/webui.mjs';

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const b64 = text => Buffer.from(text).toString('base64');

async function preview(page, html = '<webui-file-preview></webui-file-preview>') {
    const root = await mount(page, html);
    return root.locator('webui-file-preview');
}
// The element the preview built for the file, read in the same call as setFile so a later media error cannot replace it first.
function shown(el, files) {
    return el.evaluate((c, files) => {
        c.setFile(files);
        const view = c.shadowRoot.querySelector('.view').firstElementChild;
        return view && { tag: view.tagName.toLowerCase(), src: view.getAttribute('src') || view.src || '', sandbox: view.getAttribute('sandbox'), controls: view.hasAttribute('controls') };
    }, files);
}

test('images use an image element', async ({ page }) => {
    const el = await preview(page);
    await el.evaluate((c, png) => c.setFile([{ name: 'dot.png', type: 'image/png', content: `data:image/png;base64,${png}` }]), PNG);
    await expect(el.locator('img')).toHaveAttribute('src', /^blob:/);
    await expect(el.locator('img')).toHaveAttribute('alt', 'dot.png');
    await expect.poll(() => el.locator('img').evaluate(img => img.naturalWidth)).toBe(1);
    await expect(el).toHaveAttribute('kind', 'image');
});
test('a file with no type is previewed by its extension', async ({ page }) => {
    const el = await preview(page);
    await el.evaluate((c, png) => c.setFile([{ name: 'dot.PNG', type: '', content: `data:application/octet-stream;base64,${png}` }]), PNG);
    await expect.poll(() => el.locator('img').evaluate(img => img.naturalWidth)).toBe(1);
});
test('pdfs load in a frame that is not sandboxed, so the viewer works', async ({ page }) => {
    const el = await preview(page);
    // setFile builds the element synchronously, so one read in the same call is final.
    const view = await shown(el, [{ name: 'a.pdf', type: 'application/pdf', content: `data:application/pdf;base64,${b64('%PDF-1.4')}` }]);
    expect(view).toMatchObject({ tag: 'iframe', src: expect.stringMatching(/^blob:/), sandbox: null });
    await expect.poll(() => el.locator('iframe').evaluate(f => fetch(f.src).then(r => r.blob()).then(b => b.type))).toBe('application/pdf');
});
for (const [name, type, tag] of [['clip.mp4', 'video/mp4', 'video'], ['clip.mov', '', 'video'], ['clip.webm', 'video/webm', 'video'], ['song.mp3', 'audio/mpeg', 'audio'], ['song.ogg', 'application/ogg', 'audio'], ['song.flac', '', 'audio']]) {
}
test('media the browser cannot play shows the file details and a download link', async ({ page }) => {
    const el = await preview(page);
    await el.evaluate(c => c.setFile([{ name: 'broken.mp4', type: 'video/mp4', size: 9, content: 'data:video/mp4;base64,bm90IHZpZGVv' }]));
    await expect(el.locator('.fallback')).toContainText('broken.mp4');
    await expect(el.locator('.fallback')).toContainText('cannot preview');
    await expect(el.locator('.fallback a')).toHaveAttribute('download', 'broken.mp4');
    await expect(el.locator('video')).toHaveCount(0);
});
test('images the browser cannot show, such as tiff, fall back too', async ({ page }) => {
    const el = await preview(page);
    await el.evaluate(c => c.setFile([{ name: 'scan.tiff', type: 'image/tiff', content: 'data:image/tiff;base64,SUkqAA==' }]));
    await expect(el.locator('.fallback')).toContainText('scan.tiff');
});
test('html files are sandboxed so they cannot run scripts on this site', async ({ page }) => {
    const el = await preview(page);
    await el.evaluate(c => c.setFile([{ type: 'text/html', content: '<script>parent.__hacked = 1</script>' }]));
    await expect(el.locator('iframe')).toHaveAttribute('sandbox', '');
    // The frame has loaded the file, script included, so the script has had its chance to run.
    await expect(el.locator('iframe').contentFrame().locator('script')).toHaveCount(1);
    await expect.poll(() => page.evaluate(() => window.__hacked)).toBeUndefined();
});
