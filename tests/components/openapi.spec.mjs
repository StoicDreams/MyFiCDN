import { test, expect, mount } from '../support/webui.mjs';

const spec = {
    openapi: '3.0.0',
    info: { title: 'Things API', version: '1.2.0', description: 'Manage things.\nSecond line.', license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' } },
    servers: [{ url: 'https://one.test' }, { url: 'https://two.test' }],
    paths: {
        '/things/{id}': {
            get: { summary: 'Get thing', description: 'Gets one', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
            post: { summary: 'Add thing', responses: { 200: { description: 'OK' } } },
        },
    },
};

// A document like real ones: tags, $ref schemas, path-level parameters, a circular schema, and examples.
const shop = {
    openapi: '3.1.0',
    info: { title: 'Shop', version: '2' },
    servers: [{ url: '/api/{version}', variables: { version: { default: 'v2' } } }],
    tags: [{ name: 'orders', description: 'Order things' }, { name: 'users' }],
    paths: {
        '/users/{userId}': {
            summary: 'Not an endpoint',
            parameters: [{ $ref: '#/components/parameters/UserId' }],
            get: {
                tags: ['users'], summary: 'Get a user', operationId: 'getUser',
                responses: {
                    200: { description: 'The user', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
                    404: { $ref: '#/components/responses/NotFound' },
                },
            },
            delete: { tags: ['users'], summary: 'Remove a user', deprecated: true, responses: { 204: { description: 'Gone' } } },
        },
        '/orders': {
            post: {
                tags: ['orders'], summary: 'Place an order',
                parameters: [{ name: 'dryRun', in: 'query', schema: { type: 'boolean', default: false } }],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/NewOrder' } } } },
                responses: { 201: { description: 'Created', content: { 'application/json': { example: { id: 7 } } } } },
            },
        },
    },
    components: {
        parameters: { UserId: { name: 'userId', in: 'path', required: true, description: 'The user ID', schema: { type: 'integer', format: 'int64', minimum: 1 } } },
        responses: { NotFound: { description: 'No such thing' } },
        schemas: {
            User: {
                type: 'object', required: ['id', 'email'],
                properties: {
                    id: { type: 'integer', readOnly: true },
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: ['admin', 'member'] },
                    manager: { $ref: '#/components/schemas/User' },
                },
            },
            NewOrder: {
                allOf: [
                    { $ref: '#/components/schemas/Base' },
                    { type: 'object', required: ['items'], properties: { items: { type: 'array', items: { type: 'string' }, example: ['book'] } } },
                ],
            },
            Base: { type: 'object', properties: { note: { type: 'string' } } },
        },
    },
};

const open = async (page, doc = spec, attributes = '') => {
    await page.route('**/openapi-test.json', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(doc) }));
    const root = await mount(page, `<webui-openapi src="http://localhost:3199/openapi-test.json" ${attributes}></webui-openapi>`);
    return root.locator('webui-openapi');
};
const ops = el => el.locator('details.op > summary');

test('lists each endpoint and server', async ({ page }) => {
    const el = await open(page);
    await expect(ops(el)).toHaveText([/GET\s*\/things\/\{id\}\s*Get thing/, /POST\s*\/things\/\{id\}\s*Add thing/]);
    expect(await el.evaluate(c => c.baseUrl)).toBe('https://one.test');
});

test('shows the title, version, description, and license as text', async ({ page }) => {
    const el = await open(page);
    await expect(el.locator('.title')).toHaveText('Things API');
    await expect(el.locator('.versions')).toHaveText(/v1\.2\.0\s*OpenAPI 3\.0\.0/);
    await expect(el.locator('.description')).toHaveText('Manage things.\nSecond line.');
    await expect(el.locator('.links a')).toHaveAttribute('href', 'https://opensource.org/licenses/MIT');
});

test('shows the server list, and Send uses the chosen server', async ({ page }) => {
    const el = await open(page);
    await expect(el.locator('select option')).toHaveText(['https://one.test', 'https://two.test']);
    await el.locator('select').selectOption('https://two.test');
    expect(await el.evaluate(c => c.baseUrl)).toBe('https://two.test');
});

test('hash builds readable endpoint links, and a link opens its endpoint', async ({ page }) => {
    const el = await open(page, spec, 'hash="api"');
    // The same format earlier versions gave their tabs, so existing links keep working.
    await expect(el.locator('details.op').first()).toHaveAttribute('data-hash', 'api-get-things-{id}');
    await el.locator('details.op').nth(1).locator('summary').click();
    expect(await page.evaluate(() => decodeURIComponent(location.hash))).toBe('#api-post-things-{id}');
    // Load again with the link in the address bar.
    await page.evaluate(() => { location.hash = '#api-get-things-{id}'; });
    await el.evaluate(c => c.setDoc(c.doc));
    await expect(el.locator('details.op').first()).toHaveAttribute('open', '');
});

test('a document without servers still renders, with no server list', async ({ page }) => {
    const { servers, ...noServers } = spec;
    const el = await open(page, noServers);
    await expect(ops(el)).toHaveCount(2);
    await expect(el.locator('.server')).toBeHidden();
});

test('a bad url, a failed load, and a document that is not OpenAPI explain themselves', async ({ page }) => {
    await page.route('**/not-json.json', route => route.fulfill({ contentType: 'text/plain', body: 'openapi: 3.0.0' }));
    const root = await mount(page, `<webui-openapi src="not a url"></webui-openapi>
<webui-openapi src="http://localhost:3199/missing.json"></webui-openapi>
<webui-openapi src="http://localhost:3199/not-json.json"></webui-openapi>`);
    await expect(root.locator('webui-openapi').first()).toContainText('URL is not valid');
    await expect(root.locator('webui-openapi').nth(1)).toContainText('Failed to load OpenAPI');
    await expect(root.locator('webui-openapi').nth(2)).toContainText('not valid JSON');
    await root.locator('webui-openapi').first().evaluate(c => c.setDoc({ hello: 'world' }));
    await expect(root.locator('webui-openapi').first()).toContainText('not an OpenAPI document');
});

test('no src asks for one', async ({ page }) => {
    const root = await mount(page, '<webui-openapi></webui-openapi>');
    await expect(root.locator('webui-openapi')).toContainText('Enter your URL');
});

test('setDoc shows a parsed document, and resolves relative servers against its base URL', async ({ page }) => {
    const root = await mount(page, '<webui-openapi></webui-openapi>');
    const el = root.locator('webui-openapi');
    await el.evaluate((c, doc) => c.setDoc(doc, { baseUrl: 'https://shop.test/docs/openapi.yaml' }), shop);
    await expect(el.locator('.title')).toHaveText('Shop');
    expect(await el.evaluate(c => c.baseUrl)).toBe('https://shop.test/api/v2');
});

test('groups endpoints by tag in the document order, and path-level keys are not endpoints', async ({ page }) => {
    const el = await open(page, shop);
    await expect(el.locator('section.tag > h3')).toHaveText(['orders', 'users']);
    await expect(el.locator('section.tag').first().locator('.desc').first()).toHaveText('Order things');
    await expect(ops(el)).toHaveCount(3);
    await expect(el.locator('details.op[data-method="delete"]')).toHaveClass(/deprecated/);
    await expect(el.locator('details.op[data-method="delete"] .badge')).toHaveText('deprecated');
});

test('search filters endpoints and tags, and counts them', async ({ page }) => {
    const el = await open(page, shop);
    await expect(el.locator('.count')).toHaveText('3 endpoints');
    await el.locator('input[type=search]').fill('order');
    await expect(el.locator('details.op:visible')).toHaveCount(1);
    await expect(el.locator('section.tag:visible > h3')).toHaveText(['orders']);
    await expect(el.locator('.count')).toHaveText('1 of 3 endpoints');
    await el.locator('input[type=search]').fill('getUser');
    await expect(el.locator('details.op:visible')).toHaveCount(1);
    await el.locator('input[type=search]').fill('');
    await expect(el.locator('details.op:visible')).toHaveCount(3);
});

test('an endpoint shows path-level and referenced parameters, $ref responses, and schemas', async ({ page }) => {
    const el = await open(page, shop);
    const get = el.locator('details.op[data-method="get"]');
    await get.locator('summary').click();
    const params = get.locator('table.params tbody tr');
    await expect(params).toHaveCount(1);
    await expect(params.first()).toContainText('userId');
    await expect(params.first()).toContainText('path');
    await expect(params.first()).toContainText('integer (int64)');
    await expect(params.first()).toContainText('required');
    await expect(params.first()).toContainText('min 1');
    await expect(get.locator('.response[data-status="404"]')).toContainText('No such thing');
    const ok = get.locator('.response[data-status="200"]');
    await expect(ok.locator('.media-type')).toHaveText('application/json');
    await expect(ok.locator('.prop-name')).toHaveText(['id', 'email', 'role', 'manager']);
    await expect(ok.locator('.prop').filter({ hasText: 'email' }).first()).toContainText('string (email)');
    await expect(ok.locator('.prop').filter({ hasText: 'role' }).first()).toContainText('one of: "admin", "member"');
});

test('circular schemas stop instead of repeating forever', async ({ page }) => {
    const el = await open(page, shop);
    const get = el.locator('details.op[data-method="get"]');
    await get.locator('summary').click();
    const manager = get.locator('.response[data-status="200"] .prop:has(> .prop-head > .prop-name:text-is("manager"))');
    await expect(manager.locator('> .prop-head .type')).toHaveText('User');
    await expect(manager.locator('> .prop-head .note')).toContainText('refers to itself');
    await expect(manager.locator('details')).toHaveCount(0);
});

test('a request body merges allOf, and its example fills the Try it body', async ({ page }) => {
    const el = await open(page, shop);
    const post = el.locator('details.op[data-method="post"]');
    await post.locator('summary').click();
    await expect(post.locator('h4', { hasText: 'Request Body' })).toContainText('required');
    await expect(post.locator('.media').first().locator('.prop-name')).toHaveText(['note', 'items']);
    await expect(post.locator('.response[data-status="201"] pre')).toHaveText(JSON.stringify({ id: 7 }, null, 2));
    await post.locator('details.try > summary').click();
    expect(JSON.parse(await post.locator('textarea').inputValue())).toEqual({ note: 'string', items: ['book'] });
});

test('lists components as schemas, opened on demand', async ({ page }) => {
    const el = await open(page, shop);
    await expect(el.locator('details.schema > summary')).toHaveText(['User', 'NewOrder', 'Base']);
    const user = el.locator('details.schema[data-schema="User"]');
    await expect(user.locator('.prop-name')).toHaveCount(0);
    await user.locator('summary').click();
    await expect(user.locator('.prop-name')).toHaveText(['id', 'email', 'role', 'manager']);
});

test('Send fills in the path, query, and body, and sends no body for GET', async ({ page }) => {
    const requests = [];
    await page.route('https://shop.test/**', async route => {
        const r = route.request();
        requests.push({ method: r.method(), url: r.url(), body: r.postData(), type: r.headers()['content-type'] || null });
        await route.fulfill({ status: 201, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"id":7}' });
    });
    const root = await mount(page, '<webui-openapi credentials="omit"></webui-openapi>');
    const el = root.locator('webui-openapi');
    await el.evaluate((c, doc) => c.setDoc(doc, { baseUrl: 'https://shop.test/' }), shop);

    const get = el.locator('details.op[data-method="get"]');
    await get.locator('summary').click();
    await get.locator('details.try > summary').click();
    await get.locator('details.try input').fill('42');
    await get.locator('button.send').click();
    await expect(get.locator('.result .status')).toHaveText('201');

    const post = el.locator('details.op[data-method="post"]');
    await post.locator('summary').click();
    await post.locator('details.try > summary').click();
    await post.locator('details.try input').fill('true');
    await post.locator('button.send').click();
    await expect(post.locator('.result pre').last()).toHaveText(JSON.stringify({ id: 7 }, null, 2));

    expect(requests[0]).toEqual({ method: 'GET', url: 'https://shop.test/api/v2/users/42', body: null, type: null });
    expect(requests[1].method).toBe('POST');
    expect(requests[1].url).toBe('https://shop.test/api/v2/orders?dryRun=true');
    expect(requests[1].type).toBe('application/json');
    expect(JSON.parse(requests[1].body)).toEqual({ note: 'string', items: ['book'] });
});

test('a failed request explains CORS', async ({ page }) => {
    await page.route('https://shop.test/**', route => route.abort());
    const root = await mount(page, '<webui-openapi></webui-openapi>');
    const el = root.locator('webui-openapi');
    await el.evaluate((c, doc) => c.setDoc(doc, { baseUrl: 'https://shop.test/' }), shop);
    const get = el.locator('details.op[data-method="get"]');
    await get.locator('summary').click();
    await get.locator('details.try > summary').click();
    await get.locator('details.try input').fill('1');
    await get.locator('button.send').click();
    await expect(get.locator('.result .error')).toContainText('CORS');
});

test('text from the document is never run as HTML', async ({ page }) => {
    const evil = '<img src=x onerror="window.__attacked=1">';
    const doc = {
        openapi: '3.0.0', info: { title: evil, description: evil, contact: { url: 'javascript:alert(1)', name: 'Contact' } },
        paths: { '/x': { get: { summary: evil, tags: [evil], parameters: [{ name: evil, in: 'query', description: evil }], responses: { 200: { description: evil } } } } },
        components: { schemas: { [evil]: { type: 'object', description: evil } } },
    };
    const el = await open(page, doc);
    await expect(el.locator('.title')).toHaveText(evil);
    await el.locator('details.op > summary').click();
    await el.locator('details.schema > summary').click();
    await expect(el.locator('img')).toHaveCount(0);
    await expect(el.locator('.links a')).toHaveCount(0);
    expect(await page.evaluate(() => window.__attacked)).toBeUndefined();
});

test('Swagger 2.0 documents show their endpoints and definitions', async ({ page }) => {
    const doc = {
        swagger: '2.0', info: { title: 'Old', version: '1' }, host: 'old.test', basePath: '/v1', schemes: ['https'],
        paths: { '/pets': { get: { parameters: [{ name: 'limit', in: 'query', type: 'integer' }], responses: { 200: { description: 'Pets', schema: { type: 'array', items: { $ref: '#/definitions/Pet' } } } } } } },
        definitions: { Pet: { type: 'object', properties: { name: { type: 'string' } } } },
    };
    const el = await open(page, doc);
    expect(await el.evaluate(c => c.baseUrl)).toBe('https://old.test/v1');
    await el.locator('details.op > summary').click();
    await expect(el.locator('table.params')).toContainText('integer');
    await expect(el.locator('.response[data-status="200"]')).toContainText('array of Pet');
    await expect(el.locator('details.schema > summary')).toHaveText(['Pet']);
});
