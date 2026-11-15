import { test, expect, mount } from '../support/webui.mjs';

const rows = guide => guide.locator('tbody tr');

test('lists the common Markdown formatting, with what to type as code', async ({ page }) => {
    const root = await mount(page, '<webui-markdown-guide></webui-markdown-guide>');
    const guide = root.locator('webui-markdown-guide');
    await expect(guide.locator('thead th')).toHaveText(['To get', 'Type']);
    await expect(rows(guide).locator('td:first-child')).toHaveText(['A heading', 'Bold', 'Italic', 'A link', 'A bullet list', 'A numbered list', 'Inline code', 'A code block', 'A quote', 'A table']);
    await expect(guide.locator('tr[data-key="bold"] code')).toHaveText('**bold**');
    await expect(guide.locator('tr[data-key="table"] code')).toHaveText(['| A | B |', '| --- | --- |']);
    await expect(guide.locator('table')).toHaveAttribute('theme', 'info');
});
test('include adds optional rows and exclude leaves rows out', async ({ page }) => {
    const root = await mount(page, '<webui-markdown-guide include="strikethrough, task-list" exclude="table quote"></webui-markdown-guide>');
    const guide = root.locator('webui-markdown-guide');
    await expect(guide.locator('tr[data-key="strikethrough"] code')).toHaveText('~~struck~~');
    await expect(guide.locator('tr[data-key="task-list"]')).toHaveCount(1);
    await expect(guide.locator('tr[data-key="table"], tr[data-key="quote"], tr[data-key="image"]')).toHaveCount(0);
    expect(await guide.evaluate(el => el.rowKeys())).toContain('strikethrough');
});
test('include="all" shows every row, and changing attributes renders again', async ({ page }) => {
    const root = await mount(page, '<webui-markdown-guide include="all" theme="success" result-label="For" type-label="Write"></webui-markdown-guide>');
    const guide = root.locator('webui-markdown-guide');
    await expect(rows(guide)).toHaveCount(15);
    await expect(guide.locator('table')).toHaveAttribute('theme', 'success');
    await expect(guide.locator('thead th')).toHaveText(['For', 'Write']);
    await guide.evaluate(el => el.setAttribute('include', ''));
    await expect(rows(guide)).toHaveCount(10);
});
test('the examples are text, never parsed as HTML', async ({ page }) => {
    const root = await mount(page, '<webui-markdown-guide include="image"></webui-markdown-guide>');
    const guide = root.locator('webui-markdown-guide');
    await expect(guide.locator('tr[data-key="image"] code')).toHaveText('![description](https://example.com/image.png)');
    await expect(guide.locator('img, a')).toHaveCount(0);
});
