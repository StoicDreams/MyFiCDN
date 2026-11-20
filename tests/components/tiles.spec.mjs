import { test, expect, mount } from '../support/webui.mjs';

// webui-tiles lays its children out as tiles and finds them by their words. It is tested by which tiles show, what it
// says, and the events it sends, never by where the tiles end up. How the grid looks is checked by eye.
const TILES = `
<webui-tiles find="Find a project" count-label="project|projects" empty="No project matches that." label="Your projects">
    <div class="tile" role="listitem" data-find="Api /work/apis/api">Api</div>
    <div class="tile" role="listitem" data-find="Databases /work/apis/databases">Databases</div>
    <div class="tile" role="listitem">Docs site</div>
</webui-tiles>`;
// Playwright's CSS reaches into shadow roots, so the tiles are found by their own class.
const shown = root => root.locator('webui-tiles > .tile:not([filtered-out])');
const find = root => root.locator('webui-tiles .find input');
const count = root => root.locator('webui-tiles .count');

test('every tile shows, with how many there are', async ({ page }) => {
    const root = await mount(page, TILES);
    await expect(shown(root)).toHaveText(['Api', 'Databases', 'Docs site']);
    await expect(count(root)).toHaveText('3 projects');
    // Screen readers get the tiles as a list by its label, though the tiles sit in the page and the list in the shadow root.
    await expect(root.locator('webui-tiles')).toMatchAriaSnapshot(`
      - list "Your projects":
        - listitem: Api
        - listitem: Databases
        - listitem: Docs site
    `);
});

test("typing shows the tiles with every word in their data-find, or their text, ignoring case", async ({ page }) => {
    const root = await mount(page, TILES);
    await find(root).fill('APIS');
    await expect(shown(root)).toHaveText(['Api', 'Databases']);
    await expect(count(root)).toHaveText('2 of 3 projects');
    await find(root).fill('apis data');
    await expect(shown(root)).toHaveText(['Databases']);
    // A tile with no data-find is found by its text.
    await find(root).fill('site');
    await expect(shown(root)).toHaveText(['Docs site']);
    await expect(count(root)).toHaveText('1 of 3 projects');
});

test('when nothing matches it says so, and clearing the field shows every tile again', async ({ page }) => {
    const root = await mount(page, TILES);
    await find(root).fill('nothing like it');
    await expect(shown(root)).toHaveCount(0);
    await expect(root.getByText('No project matches that.')).toBeVisible();
    await find(root).fill('');
    await expect(shown(root)).toHaveCount(3);
    await expect(root.getByText('No project matches that.')).toBeHidden();
});

test('tiles added, removed, or given new words are found as they are now', async ({ page }) => {
    const root = await mount(page, TILES);
    await find(root).fill('blog');
    await expect(shown(root)).toHaveCount(0);
    await page.evaluate(() => {
        const tiles = document.querySelector('webui-tiles');
        tiles.querySelector('[data-find^="Api"]').dataset.find = 'Api blog';
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.textContent = 'Blog';
        tiles.appendChild(tile);
    });
    await expect(shown(root)).toHaveText(['Api', 'Blog']);
    await expect(count(root)).toHaveText('2 of 4 projects');
    await page.evaluate(() => document.querySelector('webui-tiles').lastElementChild.remove());
    await expect(shown(root)).toHaveText(['Api']);
    await expect(count(root)).toHaveText('1 of 3 projects');
});

test('a tile the page hides stays hidden and is not counted', async ({ page }) => {
    const root = await mount(page, TILES);
    await page.evaluate(() => { document.querySelector('webui-tiles > .tile').hidden = true; });
    await expect(count(root)).toHaveText('2 projects');
    await expect(root.locator('webui-tiles > .tile').first()).toBeHidden();
});

test('setting query finds tiles as typing does, and each change sends a filter event', async ({ page }) => {
    const root = await mount(page, TILES);
    await page.evaluate(() => {
        window.__filters = [];
        document.querySelector('webui-tiles').addEventListener('filter', ev => window.__filters.push(ev.detail));
        document.querySelector('webui-tiles').query = 'api';
    });
    await expect(shown(root)).toHaveText(['Api', 'Databases']);
    await expect(find(root)).toHaveValue('api');
    await expect.poll(() => page.evaluate(() => window.__filters)).toEqual([{ query: 'api', shown: 2, total: 3 }]);
});

test('without find there is no field, and every tile shows', async ({ page }) => {
    const root = await mount(page, '<webui-tiles><div class="tile">One</div><div class="tile">Two</div></webui-tiles>');
    await expect(root.locator('webui-tiles .tools')).toBeHidden();
    await expect(shown(root)).toHaveText(['One', 'Two']);
    await expect(root.getByRole('list')).toHaveCount(0);
});

test('min and gap set the narrowest tile and the space between them, with numbers in pixels', async ({ page }) => {
    const root = await mount(page, '<webui-tiles min="200" gap="1em"><div class="tile">One</div></webui-tiles>');
    const el = root.locator('webui-tiles');
    await expect.poll(() => el.evaluate(c => [c.style.getPropertyValue('--tile-min'), c.style.getPropertyValue('--tile-gap')])).toEqual(['200px', '1em']);
});

test('hidden hides it, as on any element', async ({ page }) => {
    const root = await mount(page, '<webui-tiles hidden><div class="tile">One</div></webui-tiles>');
    await expect(root.locator('webui-tiles')).toBeHidden();
});
