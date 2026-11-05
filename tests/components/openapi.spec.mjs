import { test, expect, mount } from '../support/webui.mjs';

const spec = {
    openapi: '3.0.0',
    servers: [{ url: 'https://one.test' }, { url: 'https://two.test' }],
    paths: {
        '/things/{id}': {
            get: { summary: 'Get thing', description: 'Gets one', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
            post: { summary: 'Add thing', responses: { 200: { description: 'OK' } } },
        },
    },
};
const open = async (page, doc = spec, attributes = '') => {
    await page.route('**/openapi-test.json', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(doc) }));
    // Avoids the known loading race tested below.
    await mount(page, '<webui-dropdown></webui-dropdown><webui-tabs></webui-tabs>');
    const root = await mount(page, `<webui-openapi src="http://localhost:3199/openapi-test.json" ${attributes}></webui-openapi>`);
    return root.locator('webui-openapi');
};

test('lists each endpoint and server', async ({ page }) => {
    const el = await open(page);
    await expect(el.locator('webui-tabs > [slot="tabs"]')).toHaveText(['GET /things/{id}', 'POST /things/{id}']);
    expect(await el.evaluate(c => c.baseUrl)).toBe('https://one.test');
});
test('shows the server dropdown', async ({ page }) => {
    test.fail(true, 'Known bug: render builds the dropdown, then clears it with t.innerHTML before adding the tabs');
    const el = await open(page);
    await expect(el.locator('webui-tabs > [slot="tabs"]')).toHaveCount(2);
    await expect(el.locator('webui-dropdown option')).toHaveText(['https://one.test', 'https://two.test'], { timeout: 500 });
});
test('hash builds readable tab links', async ({ page }) => {
    const el = await open(page, spec, 'hash="api"');
    await expect(el.locator('webui-tabs > [slot="tabs"]').first()).toHaveAttribute('hash', /^api-get-/);
});
test('a document without servers still renders', async ({ page }) => {
    const { servers, ...noServers } = spec;
    const el = await open(page, noServers);
    await expect(el.locator('webui-tabs > [slot="tabs"]')).toHaveCount(2);
});
test('a bad url and a failed load explain themselves', async ({ page }) => {
    const root = await mount(page, '<webui-openapi src="not a url"></webui-openapi><webui-openapi src="http://localhost:3199/missing.json"></webui-openapi>');
    await expect(root.locator('webui-openapi').first()).toContainText('URL is not valid');
    await expect(root.locator('webui-openapi').nth(1)).toContainText('Failed to load OpenAPI');
});
test('waits for its components before using them', async ({ page }) => {
    test.fail(true, 'Known bug: the src attribute starts loading before preloaded components are ready, giving setOptions is not a function');
    await page.route('**/webui/dropdown.*', async route => {
        await new Promise(r => setTimeout(r, 400));
        await route.fallback();
    });
    await page.route('**/openapi-test.json', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(spec) }));
    const root = await mount(page, '<webui-openapi src="http://localhost:3199/openapi-test.json"></webui-openapi>');
    await expect(root.locator('webui-tabs > [slot="tabs"]')).toHaveCount(2, { timeout: 2000 });
});
test('no src asks for one', async ({ page }) => {
    const root = await mount(page, '<webui-openapi></webui-openapi>');
    await expect(root.locator('webui-openapi')).toContainText('Enter your URL');
});
