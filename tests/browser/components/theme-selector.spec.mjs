import { test, expect, mount } from '../support/webui.mjs';

const themes = `
    <option value="" data-colors="#111111 #ff0000">Default</option>
    <option value="stone" data-colors="#222222 #c9a46a #e8e4dc">Stone</option>
    <option value="paper" data-colors="#f4f1e9 #2f5d8a">Paper</option>`;
const styles = `<style>:root[data-theme="stone"] { --color-background: rgb(34, 34, 34); }</style>`;

test('each theme shows its color swatches', async ({ page }) => {
    const root = await mount(page, `<webui-theme-selector panel>${themes}</webui-theme-selector>`);
    const swatches = root.locator('button[data-theme-value="stone"] .swatch');
    await expect(swatches).toHaveCount(3);
    await expect(swatches.nth(1)).toHaveCSS('background-color', 'rgb(201, 164, 106)');
});

const schemed = `
    <option value="" data-scheme="dark">Default</option>
    <option value="paper" data-scheme="light">Paper</option>
    <option value="stone" data-scheme="dark">Stone</option>
    <option value="sky" data-scheme="light">Sky</option>`;
const editor = (page, options = schemed) => mount(page, `${styles}<div data-stopclick><webui-theme-selector panel editable>${options}</webui-theme-selector></div>`);
const rootStyle = (page, property) => page.evaluate(property => document.documentElement.style.getPropertyValue(property), property);
const colorInput = (root, label) => root.getByLabel(label, { exact: true });

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

    test('themes are in a tab for each category, light beside dark, each a tile named for its theme', async ({ page }) => {
        await mount(page, `<webui-theme-selector panel>${categorized}</webui-theme-selector>`);
        await expect(tabs(page)).toHaveText(['Classic', 'Organic']);
        // The default theme is in use, so its category is the tab shown.
        await expect(shownCategory(page)).toHaveAttribute('data-category', 'Classic');
        await tabs(page).nth(1).click();
        const organic = panel(page).locator('.category[data-category="Organic"]');
        await expect(organic).toMatchAriaSnapshot(`
          - list "Light themes":
            - listitem "Sage"
          - list "Dark themes":
            - listitem "Moss"
            - listitem "Rosewood"
        `);
        await expect(organic.locator('webui-split-panes')).toBeVisible();
    });

});
