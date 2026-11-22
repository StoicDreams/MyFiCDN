import { test, expect, mount } from '../support/webui.mjs';

// webui-tabs in jsdom: what needs layout, such as vertical tabs, is in tests/browser/components/tabs.spec.mjs.
const html = (attributes = '') => `<webui-tabs ${attributes}>
<webui-button slot="tabs" start-icon="home">Home</webui-button><div slot="content">A</div>
<webui-button slot="tabs" start-icon="gear">Settings</webui-button><div slot="content">B</div>
<webui-button slot="tabs">Plain</webui-button><div slot="content">C</div></webui-tabs>`;
const buttons = root => root.locator('webui-tabs > [slot="tabs"]');
const toggle = root => root.locator('webui-tabs .collapse-toggle');

test('by default the tabs show their names, with a toggle that switches them to icons and back', async ({ page }) => {
    const root = await mount(page, html());
    await expect(buttons(root).nth(0)).not.toHaveAttribute('collapsed');
    await root.getByRole('button', { name: 'Show tabs as icons' }).click();
    await expect(buttons(root).nth(0)).toHaveAttribute('collapsed', '');
    // Each is named by its text, for screen readers and as its tooltip.
    await expect(root.getByRole('button', { name: 'Settings' })).toHaveAttribute('aria-label', 'Settings');
    // A tab without an icon shows two letters of its name in place of one.
    await expect(buttons(root).nth(2).locator('.initials')).toHaveText('Pl');
    await root.getByRole('button', { name: 'Show tab names' }).click();
    await expect(buttons(root).nth(0)).not.toHaveAttribute('collapsed');
    await expect(buttons(root).nth(0)).not.toHaveAttribute('aria-label');
    await expect(root.getByRole('button', { name: 'Show tabs as icons' })).toHaveCount(1);
});
test('tab-display="icon|label" starts on the icons, with the toggle', async ({ page }) => {
    const root = await mount(page, html('tab-display="icon|label"'));
    await expect(buttons(root).nth(0)).toHaveAttribute('collapsed', '');
    await expect(root.getByRole('button', { name: 'Show tab names' })).toHaveCount(1);
});
test('tab-display="icon" and tab-display="label" fix the view, with no toggle', async ({ page }) => {
    const root = await mount(page, `<div id="i">${html('tab-display="icon"')}</div><div id="l">${html('tab-display="label"')}</div>`);
    await expect(root.locator('#i webui-tabs > [slot="tabs"]').first()).toHaveAttribute('collapsed', '');
    await expect(root.locator('#i webui-tabs .collapse-toggle')).toHaveAttribute('hidden', '');
    await expect(root.locator('#l webui-tabs > [slot="tabs"]').first()).not.toHaveAttribute('collapsed');
    await expect(root.locator('#l webui-tabs .collapse-toggle')).toHaveAttribute('hidden', '');
});
test('a tab-display it does not know is the default', async ({ page }) => {
    const root = await mount(page, html('tab-display="tiles"'));
    await expect(buttons(root).nth(0)).not.toHaveAttribute('collapsed');
    await expect(toggle(root)).not.toHaveAttribute('hidden');
});
test('a button the page made icon-only stays that way when the tabs show names', async ({ page }) => {
    const root = await mount(page, html().replace('start-icon="gear"', 'start-icon="gear" icon-only'));
    await root.getByRole('button', { name: 'Show tabs as icons' }).click();
    await expect(buttons(root).nth(0)).toHaveAttribute('collapsed', '');
    await root.getByRole('button', { name: 'Show tab names' }).click();
    await expect(buttons(root).nth(0)).not.toHaveAttribute('collapsed');
    await expect(buttons(root).nth(1)).toHaveAttribute('collapsed', '');
});
test('tabs added later, such as from data, follow the view', async ({ page }) => {
    const root = await mount(page, '<webui-tabs tab-display="icon"><template slot="template" name="label"><webui-icon slot="start-icon" icon="star"></webui-icon>{TEMPLATE_NAME}</template></webui-tabs>');
    await root.locator('webui-tabs').evaluate(el => el.setData([{ name: 'Starred', content: 'S' }]));
    await expect(root.getByRole('button', { name: 'Starred' })).toHaveAttribute('collapsed', '');
});
test('tab-display-key remembers the chosen view for the next time the tabs load', async ({ page }) => {
    const root = await mount(page, html('tab-display-key="settings"'));
    await root.getByRole('button', { name: 'Show tabs as icons' }).click();
    await expect.poll(() => page.evaluate(() => webui.getData('session-webui-tabs-view-settings'))).toBe('icon');
    const again = await mount(page, html('tab-display-key="settings"'));
    await expect(buttons(again).nth(0)).toHaveAttribute('collapsed', '');
    await expect(again.getByRole('button', { name: 'Show tab names' })).toHaveCount(1);
    // A saved view tab-display no longer offers gives way to tab-display.
    const fixed = await mount(page, html('tab-display="label" tab-display-key="settings"'));
    await expect(buttons(fixed).nth(0)).not.toHaveAttribute('collapsed');
});
test('setVertical puts the tabs down the side, so toggles bound to one key switch every set of tabs', async ({ page }) => {
    const example = `<webui-toggle-icon data-bind="vertical-tabs" label="Layout" icon-on="table-columns|rotate:90" icon-off="table-columns" title-on="Show the tabs across the top" title-off="Show the tabs down the side"></webui-toggle-icon>
${html('data-subscribe="vertical-tabs:setVertical"')}`;
    const root = await mount(page, [1, 2, 3].map(n => `<div id="e${n}">${example}</div>`).join(''));
    const tabs = root.locator('webui-tabs');
    await expect(tabs).toHaveCount(3);
    for (const n of [0, 1, 2]) await expect(tabs.nth(n)).not.toHaveAttribute('vertical');
    await root.locator('#e2').getByRole('button', { name: 'Show the tabs down the side' }).click();
    for (const n of [0, 1, 2]) await expect(tabs.nth(n)).toHaveAttribute('vertical', '');
    // Every toggle shows the new state, so the next press on any of them switches back.
    await expect(root.getByRole('button', { name: 'Show the tabs across the top' })).toHaveCount(3);
    await root.locator('#e3').getByRole('button', { name: 'Show the tabs across the top' }).click();
    for (const n of [0, 1, 2]) await expect(tabs.nth(n)).not.toHaveAttribute('vertical');
    await tabs.first().evaluate(el => el.setVertical('true'));
    await expect(tabs.first()).toHaveAttribute('vertical', '');
    await tabs.first().evaluate(el => el.setVertical(false));
    await expect(tabs.first()).not.toHaveAttribute('vertical');
});
test('currentTab says which tab is shown, as it is chosen', async ({ page }) => {
    const root = await mount(page, html('index="1"'));
    const tabs = root.locator('webui-tabs');
    await expect.poll(() => tabs.evaluate(el => el.currentTab())).toBe(1);
    await buttons(root).nth(2).click();
    await expect.poll(() => tabs.evaluate(el => el.currentTab())).toBe(2);
    await tabs.evaluate(el => el.setTab(0));
    await expect.poll(() => tabs.evaluate(el => el.currentTab())).toBe(0);
});
test('removing the shown tab shows the one now in its place', async ({ page }) => {
    const root = await mount(page, html());
    const tabs = root.locator('webui-tabs');
    await buttons(root).nth(1).click();
    await expect(buttons(root).nth(1)).toHaveAttribute('aria-current', 'true');
    await tabs.evaluate(el => {
        el.tabButtons()[1].remove();
        el.tabContents()[1].remove();
        el.render();
        el.setTab(el.currentTab());
    });
    await expect(buttons(root).nth(1)).toHaveText('Plain');
    await expect(buttons(root).nth(1)).toHaveAttribute('aria-current', 'true');
    await expect.poll(() => tabs.evaluate(el => el.tabContents()[1].inert)).toBe(false);
});
test('data-bind="key:setTab" shows the tab the data names and saves the tab a person picks', async ({ page }) => {
    // Data set before the tabs load is the tab they open on.
    await page.evaluate(() => webui.setData('tabs-shown', 1));
    const root = await mount(page, html('data-bind="tabs-shown:setTab"'));
    await expect(root.getByRole('button', { name: 'Settings' })).toHaveAttribute('aria-current', 'true');
    await page.evaluate(() => webui.setData('tabs-shown', 0));
    await expect(root.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'true');
    await root.getByRole('button', { name: 'Plain' }).click();
    await expect.poll(() => page.evaluate(() => webui.getData('tabs-shown'))).toBe(2);
    // The tabs' own names and icons toggle is not a tab choice.
    await root.getByRole('button', { name: 'Show tabs as icons' }).click();
    await expect(buttons(root).nth(0)).toHaveAttribute('collapsed', '');
    expect(await page.evaluate(() => webui.getData('tabs-shown'))).toBe(2);
});
test('data-bind="key:setVertical" follows the data, and the tabs\' own toggle leaves it alone', async ({ page }) => {
    const root = await mount(page, `<webui-toggle-icon data-bind="tabs-side" label="Layout"></webui-toggle-icon>${html('data-bind="tabs-side:setVertical"')}`);
    await root.getByRole('button', { name: 'Layout' }).click();
    await expect(root.locator('webui-tabs')).toHaveAttribute('vertical', '');
    await root.getByRole('button', { name: 'Show tabs as icons' }).click();
    await expect(buttons(root).nth(0)).toHaveAttribute('collapsed', '');
    expect(await page.evaluate(() => webui.getData('tabs-side'))).toBe(true);
    await expect(root.locator('webui-tabs')).toHaveAttribute('vertical', '');
});
