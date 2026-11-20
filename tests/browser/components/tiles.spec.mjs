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

