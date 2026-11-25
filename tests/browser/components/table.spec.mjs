import { test, expect, mount } from '../support/webui.mjs';

// Angled titles are tested by what they leave reachable and what they keep in view. How they lean is checked by eye.
// Only a real browser lays them out, so these run here rather than in jsdom.

/** What a person pointing at each of these places in the page would reach, by the id or tag of what is there. */
const reached = (page, points) => page.evaluate(points => points.map(([x, y]) => {
    const found = document.elementFromPoint(x, y);
    return found?.closest('[id]')?.id || found?.tagName.toLowerCase() || '';
}), points);

test('an angled sort button covers only its header, so the first row under it is reached', async ({ page }) => {
    const root = await mount(page, `
<webui-table angled columns="Name|name;Description|description" sortable="name" style="width:auto;">
</webui-table>`);
    const table = root.locator('webui-table');
    // A wide first column, as long values make, under a sortable title.
    await table.evaluate(t => t.setData([
        { name: 'A name long enough to make its column far wider than the line its title takes', description: 'One' },
        { name: 'Second', description: 'Two' },
    ]));
    await table.evaluate(t => {
        t.querySelectorAll('tr')[1].querySelectorAll('td').forEach((td, index) => { td.id = `cell-${index}`; });
    });
    const cell = table.locator('#cell-0');
    await expect(cell).toBeVisible();
    // The cell's place is only used to point at it, as a person would: along its top edge, where a title swung out of
    // its header would reach.
    const box = await cell.boundingBox();
    const points = [0.05, 0.25, 0.5, 0.75, 0.95].map(share => [box.x + box.width * share, box.y + 2]);
    await expect.poll(() => reached(page, points)).toEqual(points.map(() => 'cell-0'));
    // The title still sorts.
    await table.getByRole('button', { name: 'Name' }).click();
    await expect(table).toHaveAttribute('current-sort-dir', 'desc');
});

test('a long last title stays inside a box that clips what leaves it', async ({ page }) => {
    const root = await mount(page, `
<div id="box" style="display:inline-block;overflow:hidden;">
    <webui-table angled columns="Key|key;A title much longer than any value in its column|note" style="width:auto;"></webui-table>
</div>`);
    const table = root.locator('webui-table');
    await table.evaluate(t => t.setData([{ key: 'P-1', note: 'x' }]));
    const title = table.locator('th').last().locator('span');
    await expect(title).toHaveText('A title much longer than any value in its column');
    // Near the far end of the title, where it leans out furthest to the right, is still the title, not clipped away.
    // The title runs corner to corner across the box it leans in.
    await expect.poll(() => title.evaluate(span => {
        const box = span.getBoundingClientRect();
        const found = document.elementFromPoint(box.left + box.width * 0.9, box.bottom - box.height * 0.9);
        return span.contains(found);
    })).toBe(true);
});
