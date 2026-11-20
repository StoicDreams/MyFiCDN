import { test, expect, mount } from '../support/webui.mjs';

const themes = `
    <option value="" data-colors="#111111 #ff0000">Default</option>
    <option value="stone" data-colors="#222222 #c9a46a #e8e4dc">Stone</option>
    <option value="paper" data-colors="#f4f1e9 #2f5d8a">Paper</option>`;
const styles = `<style>:root[data-theme="stone"] { --color-background: rgb(34, 34, 34); }</style>`;

test('the button opens the themes in a dialog when there is no drawer', async ({ page }) => {
    const root = await mount(page, `${styles}<webui-dialogs></webui-dialogs><webui-theme-selector title="Choose a theme">${themes}</webui-theme-selector>`);
    const button = root.locator('webui-theme-selector:not([panel])');
    await expect(button).toHaveAttribute('role', 'button');
    await expect(button).toHaveAttribute('aria-label', 'Choose a theme');
    await button.click();
    const panel = page.locator('webui-theme-selector[panel]');
    await expect(panel.getByRole('button')).toHaveText(['Default', 'Stone', 'Paper']);
    await expect(panel.getByRole('button', { name: 'Default' })).toHaveAttribute('aria-pressed', 'true');
});

test('choosing a theme sets data-theme on the page and saves it', async ({ page }) => {
    const root = await mount(page, `${styles}<webui-dialogs></webui-dialogs><webui-theme-selector>${themes}</webui-theme-selector>`);
    await root.locator('webui-theme-selector').click();
    const panel = page.locator('webui-theme-selector[panel]');
    await panel.getByRole('button', { name: 'Stone' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'stone');
    await expect(panel.getByRole('button', { name: 'Stone' })).toHaveAttribute('aria-pressed', 'true');
    await expect(panel.getByRole('button', { name: 'Default' })).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => page.evaluate(() => webui.getData('session-theme'))).toBe('stone');
    await panel.getByRole('button', { name: 'Default' }).click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /./);
    await expect.poll(() => page.evaluate(() => webui.getData('session-theme'))).toBe('');
});

test('the button opens the themes in the drawer named by data-toggleclass, and closes it again', async ({ page }) => {
    const root = await mount(page, `<webui-drawer class="shared" data-stopclick></webui-drawer><webui-theme-selector data-toggleclass=".shared|open" data-title="Site theme">${themes}</webui-theme-selector>`);
    const drawer = root.locator('webui-drawer.shared');
    const button = root.locator('webui-theme-selector:not([panel])');
    // The open drawer covers the bare test page, so the clicks are dispatched to the button directly.
    await button.dispatchEvent('click');
    await expect(drawer).toHaveClass(/open/);
    await expect(drawer.locator('header')).toHaveText('Site theme');
    await expect(drawer.locator('webui-theme-selector[panel]').getByRole('button')).toHaveCount(3);
    await button.dispatchEvent('click');
    await expect(drawer).not.toHaveClass(/open/);
});

test('switches an open drawer over from other content instead of closing it', async ({ page }) => {
    const root = await mount(page, `<webui-drawer class="shared open" data-stopclick><p>Alerts</p></webui-drawer><webui-theme-selector data-toggleclass=".shared|open">${themes}</webui-theme-selector>`);
    await root.locator('webui-theme-selector:not([panel])').dispatchEvent('click');
    const drawer = root.locator('webui-drawer.shared');
    await expect(drawer.locator('webui-theme-selector[panel]')).toHaveCount(1);
    await expect(drawer).toHaveClass(/open/);
});

test('works as a button from the keyboard', async ({ page }) => {
    const root = await mount(page, `<webui-dialogs></webui-dialogs><webui-theme-selector>${themes}</webui-theme-selector>`);
    const button = root.locator('webui-theme-selector');
    // It can take focus once it has set itself up as a button.
    await expect(button).toHaveAttribute('tabindex', '0');
    await button.focus();
    await expect(button).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('webui-theme-selector[panel]').getByRole('button')).toHaveCount(3);
});

test('a saved theme is applied by the loader before the page draws', async ({ page }) => {
    await page.evaluate(() => webui.setData('session-theme', 'stone'));
    // Session data is saved to storage shortly after it is set.
    await expect.poll(() => page.evaluate(() => `${webui.storage.getItem('session-data') || ''}`)).toContain('stone');
    await page.reload();
    await page.waitForFunction(() => typeof webui === 'object');
    // The loader applies it as it starts, so one read as soon as the loader exists is final, and a later one
    // would not show that it was there before the page drew.
    const theme = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(theme).toBe('stone');
});

test('a saved theme the site no longer offers falls back to the default', async ({ page }) => {
    await page.evaluate(() => webui.setData('session-theme', 'retired'));
    await mount(page, `<webui-theme-selector>${themes}</webui-theme-selector>`);
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /./);
    await expect.poll(() => page.evaluate(() => webui.getData('session-theme'))).toBe('');
});

test('updates the browser theme-color to the theme background', async ({ page }) => {
    await page.evaluate(() => {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = '#000000';
        document.head.appendChild(meta);
    });
    const root = await mount(page, `${styles}<webui-dialogs></webui-dialogs><webui-theme-selector>${themes}</webui-theme-selector>`);
    await root.locator('webui-theme-selector').click();
    await page.locator('webui-theme-selector[panel]').getByRole('button', { name: 'Stone' }).click();
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', 'rgb(34, 34, 34)');
});

const schemed = `
    <option value="" data-scheme="dark">Default</option>
    <option value="paper" data-scheme="light">Paper</option>
    <option value="stone" data-scheme="dark">Stone</option>
    <option value="sky" data-scheme="light">Sky</option>`;
const editor = (page, options = schemed) => mount(page, `${styles}<div data-stopclick><webui-theme-selector panel editable>${options}</webui-theme-selector></div>`);
const rootStyle = (page, property) => page.evaluate(property => document.documentElement.style.getPropertyValue(property), property);
const colorInput = (root, label) => root.getByLabel(label, { exact: true });

test('themes marked light or dark are listed in those groups', async ({ page }) => {
    const root = await mount(page, `<webui-theme-selector panel>${schemed}</webui-theme-selector>`);
    const panel = root.locator('webui-theme-selector');
    await expect(panel.getByRole('group', { name: 'Light themes' }).getByRole('button')).toHaveText(['Paper', 'Sky']);
    await expect(panel.getByRole('group', { name: 'Dark themes' }).getByRole('button')).toHaveText(['Default', 'Stone']);
});

test('without the editable flag there are no color inputs', async ({ page }) => {
    const root = await mount(page, `<webui-theme-selector panel>${schemed}</webui-theme-selector>`);
    await expect(root.locator('webui-theme-selector').getByRole('button', { name: 'Stone' })).toBeVisible();
    await expect(root.locator('input[type="color"]')).toHaveCount(0);
});

test('an editable selector has an input for each base color, showing the color the page uses', async ({ page }) => {
    const root = await editor(page);
    await root.getByRole('button', { name: 'Stone' }).click();
    const labels = ['Background', 'Title', 'Primary', 'Secondary', 'Tertiary', 'Active', 'Button'];
    for (const label of labels) await expect(colorInput(root, label)).toBeVisible();
    // The stone theme's background, from its stylesheet.
    await expect(colorInput(root, 'Background')).toHaveValue('#222222');
});

test('a color changes on the page at once, and its text switches to white or black for contrast', async ({ page }) => {
    const root = await editor(page);
    // The offset is the tool's output: which of white and black reads better on the chosen color.
    await colorInput(root, 'Primary').fill('#f5f0d0');
    await expect.poll(() => rootStyle(page, '--color-primary')).toBe('#f5f0d0');
    await expect.poll(() => rootStyle(page, '--color-primary-offset')).toBe('var(--color-black)');
    await colorInput(root, 'Primary').fill('#1a237e');
    await expect.poll(() => rootStyle(page, '--color-primary')).toBe('#1a237e');
    await expect.poll(() => rootStyle(page, '--color-primary-offset')).toBe('var(--color-white)');
    await expect.poll(() => page.evaluate(() => webui.getData('session-theme-colors'))).toEqual({
        '': { '--color-primary': '#1a237e', '--color-primary-offset': 'var(--color-white)' },
    });
});

test('each theme keeps its own adjusted colors, and Reset puts the theme back', async ({ page }) => {
    const root = await editor(page);
    const reset = root.getByRole('button', { name: /^Reset/ });
    await root.getByRole('button', { name: 'Stone' }).click();
    await expect(reset).toBeHidden();
    await colorInput(root, 'Title').fill('#ff8800');
    await expect.poll(() => rootStyle(page, '--color-title')).toBe('#ff8800');
    await expect(root.getByRole('button', { name: 'Reset Stone colors' })).toBeVisible();
    // Another theme has none of stone's changes.
    await root.getByRole('button', { name: 'Paper' }).click();
    await expect.poll(() => rootStyle(page, '--color-title')).toBe('');
    await expect(reset).toBeHidden();
    // Back on stone, its changes return.
    await root.getByRole('button', { name: 'Stone' }).click();
    await expect.poll(() => rootStyle(page, '--color-title')).toBe('#ff8800');
    await root.getByRole('button', { name: 'Reset Stone colors' }).click();
    await expect.poll(() => rootStyle(page, '--color-title')).toBe('');
    await expect(reset).toBeHidden();
    await expect.poll(() => page.evaluate(() => webui.getData('session-theme-colors'))).toEqual({});
});

test('quick changes to two colors are both kept', async ({ page }) => {
    const root = await editor(page);
    await colorInput(root, 'Primary').fill('#112233');
    await colorInput(root, 'Secondary').fill('#445566');
    await expect.poll(() => page.evaluate(() => webui.getData('session-theme-colors')?.['']))
        .toMatchObject({ '--color-primary': '#112233', '--color-secondary': '#445566' });
});

test('a color input inside a drawer that cancels clicks still opens its picker', async ({ page }) => {
    const root = await editor(page);
    // The editor sits in a data-stopclick container, as in a Web UI drawer, which cancels the clicks that reach it.
    const cancelled = await colorInput(root, 'Background').evaluate(input => {
        const click = new MouseEvent('click', { bubbles: true, composed: true, cancelable: true });
        input.dispatchEvent(click);
        return click.defaultPrevented;
    });
    expect(cancelled).toBe(false);
});

test('adjusted colors are applied by the loader before the page draws', async ({ page }) => {
    await page.evaluate(() => {
        webui.setData('session-theme', 'stone');
        webui.setData('session-theme-colors', { stone: { '--color-primary': '#123456', '--color-primary-offset': 'var(--color-white)' }, paper: { '--color-primary': '#abcdef' } });
    });
    await expect.poll(() => page.evaluate(() => `${webui.storage.getItem('session-data') || ''}`)).toContain('#123456');
    await page.reload();
    await page.waitForFunction(() => typeof webui === 'object');
    // As with the theme, one read as soon as the loader exists is final.
    const applied = await page.evaluate(() => [
        document.documentElement.style.getPropertyValue('--color-primary'),
        document.documentElement.style.getPropertyValue('--color-primary-offset'),
    ]);
    expect(applied).toEqual(['#123456', 'var(--color-white)']);
});

test('a theme and colors saved after the page starts are applied, as an app restores them', async ({ page }) => {
    await mount(page, `${styles}<webui-theme-selector>${themes}</webui-theme-selector>`);
    await expect(page.locator('webui-theme-selector')).toHaveAttribute('role', 'button');
    await page.evaluate(() => {
        webui.setData('session-theme-colors', { stone: { '--color-title': '#00ff00', '--color-title-offset': 'var(--color-black)' } });
        webui.setData('session-theme', 'stone');
    });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'stone');
    await expect.poll(() => rootStyle(page, '--color-title')).toBe('#00ff00');
});

test.describe('categories', () => {
    const categorized = `
        <option value="" data-scheme="dark" data-category="Classic" data-colors="#222222 #1878af #5e0592 #333333 #444444 #0d9488 #0369a1">Default</option>
        <option value="porcelain" data-scheme="light" data-category="Classic" data-colors="#fafafa #4078f2 #a626a4 #e5e5e6 #0184bc #50a14f #4078f2">Porcelain</option>
        <option value="moss" data-scheme="dark" data-category="Organic" data-colors="#2d353b #475258 #a7c080 #3d484d #dbbc7f #83c092 #7fbbb3">Moss</option>
        <option value="sage" data-scheme="light" data-category="Organic" data-colors="#fdf6e3 #8da101 #35a77c #e6e2cc #dfa000 #3a94c5 #8da101">Sage</option>
        <option value="rosewood" data-scheme="dark" data-category="Organic" data-colors="#191724">Rosewood</option>`;
    const panel = page => page.locator('webui-theme-selector[panel]');
    const tabs = page => panel(page).locator('webui-tabs.categories > webui-button.category-tab');
    const shownCategory = page => panel(page).locator('webui-tabs.categories > .category:not([tab-hidden])');

    test('choosing a tile applies its theme and marks it, and the category shown stays shown', async ({ page }) => {
        await mount(page, `<webui-theme-selector panel>${categorized}</webui-theme-selector>`);
        await tabs(page).nth(1).click();
        await panel(page).getByRole('listitem', { name: 'Sage' }).click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'sage');
        await expect(panel(page).getByRole('listitem', { name: 'Sage' })).toHaveAttribute('aria-pressed', 'true');
        await expect(panel(page).getByRole('listitem', { name: 'Porcelain' })).toHaveAttribute('aria-pressed', 'false');
        await expect(shownCategory(page)).toHaveAttribute('data-category', 'Organic');
    });

    test('opened again, it starts on the category of the theme in use', async ({ page }) => {
        await mount(page, `<webui-theme-selector panel>${categorized}</webui-theme-selector>`);
        await tabs(page).nth(1).click();
        await panel(page).getByRole('listitem', { name: 'Moss' }).click();
        await mount(page, `<webui-theme-selector panel>${categorized}</webui-theme-selector>`);
        await expect(shownCategory(page)).toHaveAttribute('data-category', 'Organic');
    });

    test("a tile is drawn in its theme's colors, from data-colors", async ({ page }) => {
        // The preview's colors are what it shows, so they are checked here.
        await mount(page, `<webui-theme-selector panel>${categorized}</webui-theme-selector>`);
        const preview = panel(page).locator('button.tile[data-theme-value="porcelain"] .preview');
        await expect.poll(() => preview.evaluate(el => [el.style.background, el.querySelector('.bar').style.background, el.querySelectorAll('.pill').length])).toEqual(['rgb(250, 250, 250)', 'rgb(64, 120, 242)', 4]);
    });

    test("a tile shows its theme's heading font, texture and mark, from data-font, data-texture and data-mark", async ({ page }) => {
        const dot = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 4'%3E%3Ccircle cx='2' cy='2' r='1'/%3E%3C/svg%3E";
        await mount(page, `<webui-theme-selector panel>${categorized}
            <option value="stone" data-scheme="dark" data-category="Classic" data-colors="#1b1c1e #c9a46a" data-font="Georgia, serif" data-texture="${dot}" data-mark="${dot}">Stone</option>
        </webui-theme-selector>`);
        const preview = panel(page).locator('button.tile[data-theme-value="stone"] .preview');
        await expect.poll(() => preview.evaluate(el => [
            el.style.backgroundImage.includes('svg+xml'),
            el.querySelector('.bar').style.fontFamily,
            el.querySelector('.bar .mark')?.style.backgroundImage.includes('svg+xml'),
        ])).toEqual([true, 'Georgia, serif', true]);
        // A theme without them draws no mark.
        await expect(panel(page).locator('button.tile[data-theme-value="porcelain"] .preview .mark')).toHaveCount(0);
    });
});
