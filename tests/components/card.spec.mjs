import { test, expect, mount } from '../support/webui.mjs';

test('shows a header with the name', async ({ page }) => {
    const root = await mount(page, '<webui-card name="Title" theme="info"><p>Body</p></webui-card>');
    const card = root.locator('webui-card');
    await expect(card.locator('header section')).toHaveText('Title');
    await expect(card.locator('header')).toHaveClass('theme-info');
    await expect(card).toHaveClass(/elevation-10/);
});
test('avatar, link, and width are applied', async ({ page }) => {
    const root = await mount(page, '<webui-card name="T" avatar="person" link="/x" width="100"></webui-card>');
    const card = root.locator('webui-card');
    await expect(card.locator('header webui-avatar')).toHaveAttribute('src', 'person');
    await expect(card.locator('header a')).toHaveAttribute('href', '/x');
    expect(await card.evaluate(el => el.style.maxWidth)).toBe('100px');
});
test('only builds its header once per burst of attributes', async ({ page }) => {
    const root = await mount(page, '<webui-card></webui-card>');
    const card = root.locator('webui-card');
    expect(await card.evaluate(async el => {
        let builds = 0;
        const original = el.buildHeader;
        el.buildHeader = () => { builds++; original(); };
        el.setAttribute('name', 'a');
        el.setAttribute('theme', 'info');
        el.setAttribute('width', '100');
        await webui.wait(10);
        return builds;
    })).toBe(1);
});
test('keeps its content when moved', async ({ page }) => {
    const root = await mount(page, '<webui-card name="N"><p>BODY</p></webui-card>');
    const card = root.locator('webui-card');
    await expect(card.locator('header')).toHaveCount(1);
    await card.evaluate(el => {
        const parent = el.parentNode;
        const holder = document.createDocumentFragment();
        holder.appendChild(el);
        parent.appendChild(holder);
    });
    await expect(card.locator('p')).toHaveText('BODY');
    await expect(card.locator('header')).toHaveCount(1);
});
test('the icon link in the header has a name for screen readers', async ({ page }) => {
    const root = await mount(page, '<webui-card name="JSON Formatter" link="/json-formatter"><p>Body</p></webui-card>');
    await expect(root.locator('webui-card header a')).toHaveAttribute('aria-label', 'Open JSON Formatter');
});
