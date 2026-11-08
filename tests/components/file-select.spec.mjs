import { test, expect, mount } from '../support/webui.mjs';

const file = (name, type, text = 'x') => ({ name, mimeType: type, buffer: Buffer.from(text) });

test('pdf, json, images, and text are read and sent to data-trigger', async ({ page }) => {
    const root = await mount(page, '<webui-file-select data-trigger="fs-files" multiple></webui-file-select>');
    const el = root.locator('webui-file-select');
    await el.locator('input').setInputFiles([file('a.pdf', 'application/pdf'), file('b.json', 'application/json', '{}'), file('c.png', 'image/png'), file('d.txt', 'text/plain', 'words')]);
    await expect.poll(() => page.evaluate(() => webui.getData('fs-files')?.length)).toBe(4);
    const files = await page.evaluate(() => webui.getData('fs-files'));
    expect(files.map(f => f.name)).toEqual(['a.pdf', 'b.json', 'c.png', 'd.txt']);
    expect(files[0].content).toMatch(/^data:application\/pdf/);
    expect(files[1].content).toBe('{}');
    expect(files[2].content).toMatch(/^data:image\/png/);
    expect(files[3].content).toBe('words');
    await expect(el).toHaveClass(/selected/);
});
test('the label shows the file name, cut to the limit', async ({ page }) => {
    const root = await mount(page, '<webui-file-select label="Pick" label-limit="5"></webui-file-select>');
    const el = root.locator('webui-file-select');
    await expect(el.locator('label')).toHaveText('Pick');
    await el.locator('input').setInputFiles([file('abcdefgh.txt', 'text/plain')]);
    await expect(el.locator('label')).toHaveText('abcde...');
});
test('the clear button empties the selection and data', async ({ page }) => {
    const root = await mount(page, '<webui-file-select data-trigger="fs-clear"></webui-file-select>');
    const el = root.locator('webui-file-select');
    await el.locator('input').setInputFiles([file('a.txt', 'text/plain')]);
    await expect.poll(() => page.evaluate(() => webui.getData('fs-clear')?.length)).toBe(1);
    await el.locator('webui-button').evaluate(b => b.click());
    await expect(el).not.toHaveClass(/selected/);
    await expect.poll(() => page.evaluate(() => webui.getData('fs-clear')?.length)).toBe(0);
});
test('multiple and accept pass to the input, and multiple can be removed', async ({ page }) => {
    const root = await mount(page, '<webui-file-select multiple accept=".txt"></webui-file-select>');
    const el = root.locator('webui-file-select');
    await expect(el.locator('input')).toHaveAttribute('accept', '.txt');
    await expect(el.locator('input')).toHaveAttribute('multiple', 'true');
    await el.evaluate(c => c.removeAttribute('multiple'));
    await expect(el.locator('input')).not.toHaveAttribute('multiple');
});
test('each item keeps its File', async ({ page }) => {
    const root = await mount(page, '<webui-file-select data-trigger="fs-file"></webui-file-select>');
    await root.locator('webui-file-select input').setInputFiles([file('a.mp4', 'video/mp4')]);
    await expect.poll(() => page.evaluate(() => webui.getData('fs-file')?.length)).toBe(1);
    expect(await page.evaluate(() => {
        const item = webui.getData('fs-file')[0];
        return [item.file instanceof File, item.file.name];
    })).toEqual([true, 'a.mp4']);
});
