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

for (const [name, type, tag] of [['clip.mp4', 'video/mp4', 'video'], ['clip.mov', '', 'video'], ['clip.webm', 'video/webm', 'video'], ['song.mp3', 'audio/mpeg', 'audio'], ['song.ogg', 'application/ogg', 'audio'], ['song.flac', '', 'audio']]) {
    test(`${name} plays in ${tag === 'video' ? 'a video' : 'an audio'} element with controls`, async ({ page }) => {
        const el = await preview(page);
        // setFile builds the element synchronously, so one read in the same call is final.
        const view = await shown(el, [{ name, type, content: `data:application/octet-stream;base64,${b64('not media')}` }]);
        expect(view).toMatchObject({ tag, controls: true, src: expect.stringMatching(/^blob:/) });
    });
}
test('text is shown as text, not rendered as html', async ({ page }) => {
    const el = await preview(page);
    await el.evaluate(c => c.setFile([{ name: 'a.txt', type: 'text/plain', content: '<b>bold</b>\n  indented' }]));
    await expect(el.locator('pre.text')).toHaveText('<b>bold</b>\n  indented');
    await expect(el.locator('b')).toHaveCount(0);
});
test('source files with no type are read as text', async ({ page }) => {
    const el = await preview(page);
    await el.evaluate((c, data) => c.setFile([{ name: 'main.rs', type: '', content: `data:application/octet-stream;base64,${data}` }]), b64('fn main() {}'));
    await expect(el.locator('pre.text')).toHaveText('fn main() {}');
});
test('json is formatted', async ({ page }) => {
    const el = await preview(page);
    await el.evaluate(c => c.setFile([{ name: 'a.json', type: 'application/json', content: '{"a":[1,2]}' }]));
    await expect(el.locator('pre.text')).toHaveText('{\n  "a": [\n    1,\n    2\n  ]\n}');
});
test('csv files show as a table, keeping quoted commas and newlines', async ({ page }) => {
    const el = await preview(page);
    await el.evaluate(c => c.setFile([{ name: 'a.csv', type: 'text/csv', content: 'name,note\r\nAda,"one, two"\nBob,"say ""hi""\nthere"\n' }]));
    await expect(el.locator('th')).toHaveText(['name', 'note']);
    await expect(el.locator('tbody tr')).toHaveCount(2);
    await expect(el.locator('td').nth(1)).toHaveText('one, two');
    await expect(el.locator('td').nth(3)).toHaveText('say "hi"\nthere');
});
test('large tables show the first 500 rows', async ({ page }) => {
    const el = await preview(page);
    await el.evaluate(c => c.setFile([{ name: 'a.tsv', type: '', content: 'n\tv\n' + Array.from({ length: 800 }, (_, i) => `${i}\tx`).join('\n') }]));
    await expect(el.locator('tbody tr')).toHaveCount(500);
    await expect(el.locator('.note')).toHaveText('Showing the first 500 of 800 rows.');
});
test('fonts that fail to load fall back to the file details', async ({ page }) => {
    const el = await preview(page);
    await el.evaluate(c => c.setFile([{ name: 'a.woff2', type: '', content: 'data:font/woff2;base64,AAAA' }]));
    await expect(el.locator('.fallback')).toContainText('a.woff2');
});
test('other files show their name, type, size, and a download link', async ({ page }) => {
    const el = await preview(page);
    await el.evaluate(c => c.setFile([{ name: 'a.zip', type: 'application/zip', content: 'data:application/zip;base64,UEsDBA==' }]));
    await expect(el.locator('.fallback')).toContainText('application/zip - 4 Bytes');
    await expect(el.locator('.fallback a')).toHaveAttribute('href', /^blob:/);
});
test('File objects and a single file without an array work', async ({ page }) => {
    const el = await preview(page);
    await el.evaluate(c => c.setFile(new File(['hello'], 'a.md', { type: '' })));
    await expect(el.locator('pre.text')).toHaveText('hello');
});
test('the src attribute previews a url', async ({ page }) => {
    await page.route('**/files/notes.txt', route => route.fulfill({ contentType: 'text/plain', body: 'from the server' }));
    const el = await preview(page, '<webui-file-preview src="/files/notes.txt"></webui-file-preview>');
    await expect(el.locator('pre.text')).toHaveText('from the server');
});
test('several files get pagination to move between them', async ({ page }) => {
    const el = await preview(page);
    await expect(el.locator('webui-pagination')).toBeHidden();
    await el.evaluate(c => c.setFile([{ name: 'a.txt', type: 'text/plain', content: 'first' }, { name: 'b.txt', type: 'text/plain', content: 'second' }]));
    await expect(el.locator('pre.text')).toHaveText('first');
    await expect(el.locator('webui-pagination')).toBeVisible();
    await el.locator('webui-pagination').evaluate(p => p.setValue(2));
    await expect(el.locator('pre.text')).toHaveText('second');
});
test('the details flag shows the name, size, and a download link', async ({ page }) => {
    const el = await preview(page, '<webui-file-preview details></webui-file-preview>');
    await el.evaluate(c => c.setFile([{ name: 'a.txt', type: 'text/plain', content: 'hello' }]));
    await expect(el.locator('.details')).toContainText('a.txt');
    await expect(el.locator('.details')).toContainText('5 Bytes');
    await expect(el.locator('.details a')).toHaveAttribute('download', 'a.txt');
});
test('nodownload leaves out the download links', async ({ page }) => {
    const el = await preview(page, '<webui-file-preview details nodownload></webui-file-preview>');
    await el.evaluate(c => c.setFile([{ name: 'a.bin', content: 'x' }]));
    await expect(el.locator('.fallback')).toContainText('a.bin');
    await expect(el.locator('.details')).toContainText('a.bin');
    await expect(el.locator('a')).toHaveCount(0);
});
test('noframes shows pdf and html files as details, not in a frame', async ({ page }) => {
    const el = await preview(page, '<webui-file-preview noframes></webui-file-preview>');
    for (const file of [{ name: 'a.pdf', type: 'application/pdf', content: '%PDF-1.4' }, { name: 'a.html', type: 'text/html', content: '<b>x</b>' }]) {
        await el.evaluate((c, file) => c.setFile([file]), file);
        await expect(el.locator('iframe')).toHaveCount(0);
        await expect(el.locator('.fallback')).toContainText(file.name);
        await expect(el.locator('.fallback')).toContainText('cannot be previewed here');
    }
});
test('clear removes the preview and frees its object url, and empty input clears', async ({ page }) => {
    const el = await preview(page);
    await el.evaluate(c => {
        window.__revoked = [];
        const revoke = URL.revokeObjectURL;
        URL.revokeObjectURL = url => { window.__revoked.push(url); revoke(url); };
    });
    const src = (await shown(el, [{ name: 'a.pdf', type: 'application/pdf', content: 'data:application/pdf;base64,AA' }])).src;
    await el.evaluate(c => c.setFile([]));
    await expect(el.locator('iframe')).toHaveCount(0);
    await expect(el).not.toHaveAttribute('kind');
    await expect.poll(() => page.evaluate(() => window.__revoked)).toEqual([src]);
});
// height and max-height are applied to the preview itself, which is its state. How tall things look is checked by eye.
test('height sets the preview\'s height', async ({ page }) => {
    const el = await preview(page, '<webui-file-preview height="50"></webui-file-preview>');
    await el.evaluate((c, png) => c.setFile([{ type: 'image/png', content: `data:image/png;base64,${png}` }]), PNG);
    await expect.poll(() => el.evaluate(c => c.style.height)).toBe('50px');
    await expect(el.locator('img')).toBeVisible();
});
test('max-height sets the most a preview may be', async ({ page }) => {
    const el = await preview(page, '<webui-file-preview max-height="120"></webui-file-preview>');
    await el.evaluate(c => c.setFile([{ type: 'application/pdf', content: 'data:application/pdf;base64,AA' }]));
    await expect.poll(() => el.evaluate(c => [c.style.maxHeight, c.style.getPropertyValue('--preview-max-height')])).toEqual(['120px', '120px']);
    await expect(el.locator('iframe')).toBeVisible();
});
