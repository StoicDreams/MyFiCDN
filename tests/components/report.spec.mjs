import { test, expect, mount } from '../support/webui.mjs';

const report = async (page, attributes = '', response = { items: [{ Name: 'A' }, { Name: 'B' }], page: 1, total: 2 }) => {
    const requests = [];
    await page.route('**/report-api', route => {
        requests.push(JSON.parse(route.request().postData()));
        return route.fulfill({ contentType: 'application/json', body: JSON.stringify(response) });
    });
    const root = await mount(page, `<webui-report api="http://localhost:3199/report-api" columns="Name" sort-column="Name" ${attributes}></webui-report>`);
    return { el: root.locator('webui-report'), requests };
};

test('loads rows from the api', async ({ page }) => {
    const { el, requests } = await report(page);
    await expect(el.locator('td')).toHaveText(['A', 'B']);
    expect(requests[0]).toEqual({ perPage: 10, page: 1, sortColumn: 'Name', sortOrder: 'asc' });
});
test('label displays a heading', async ({ page }) => {
    const { el } = await report(page, 'label="Sales"');
    await expect(el.locator('h3')).toHaveText('Sales');
});
test('every filter is subscribed separately, and included in requests', async ({ page }) => {
    await page.evaluate(() => { webui.setData('rp-a', 1); webui.setData('rp-b', { x: 2 }); });
    const { el, requests } = await report(page, 'filters="rp-a;rp-b"');
    await expect(el.locator('td').first()).toHaveText('A');
    expect(requests[0]).toMatchObject({ 'rp-a': 1, x: 2 });
    const subscribe = await el.getAttribute('data-subscribe');
    expect(subscribe.split('|')).toEqual(expect.arrayContaining(['rp-a:loadData', 'rp-b:loadData']));
    await page.evaluate(() => webui.setData('rp-a', 9));
    await expect.poll(() => requests.at(-1)['rp-a']).toBe(9);
});
test('required filters hold the request until present', async ({ page }) => {
    const { el, requests } = await report(page, 'filters="rp-need" required-filters="rp-need"');
    await page.waitForTimeout(500);
    expect(requests).toEqual([]);
    await page.evaluate(() => webui.setData('rp-need', 1));
    await expect(el.locator('td').first()).toHaveText('A');
});
test('missing settings explain what is wrong', async ({ page }) => {
    const root = await mount(page, '<webui-report api="/x"></webui-report><webui-report sort-column="a"></webui-report>');
    await expect(root.locator('webui-report').first().locator('webui-alert')).toHaveText('Report is missing default sort-column');
    await expect(root.locator('webui-report').nth(1).locator('webui-alert')).toHaveText('Report is missing api');
});
test('api errors display as text, not html', async ({ page }) => {
    await page.route('**/report-api', route => route.fulfill({ status: 500, body: '<img src=x onerror="window.__hacked=1">' }));
    const root = await mount(page, '<webui-report api="http://localhost:3199/report-api" sort-column="Name"></webui-report>');
    const alert = root.locator('webui-report webui-alert');
    await expect(alert).toContainText('API Error: <img');
    await expect(alert.locator('img')).toHaveCount(0);
    expect(await page.evaluate(() => window.__hacked)).toBeUndefined();
});
test('sorting requests the new order', async ({ page }) => {
    const { el, requests } = await report(page, 'sortable="Name"');
    await expect(el.locator('td').first()).toHaveText('A');
    await el.locator('th webui-flex').click();
    await expect.poll(() => requests.at(-1).sortOrder).toBe('desc');
});
test('changing page requests that page', async ({ page }) => {
    const { el, requests } = await report(page, '', { items: [{ Name: 'A' }], page: 1, total: 50 });
    await expect(el.locator('td').first()).toHaveText('A');
    await el.evaluate(c => c.setPage(3));
    await expect.poll(() => requests.at(-1).page).toBe(3);
});
test('choosing a page size requests the first page at that size', async ({ page }) => {
    const { el, requests } = await report(page, '', { items: [{ Name: 'A' }], page: 1, total: 120 });
    await expect(el.locator('td').first()).toHaveText('A');
    await expect(el.locator('webui-pagination').first().locator('select')).toHaveValue('10');
    await el.evaluate(c => c.setPage(3));
    await expect.poll(() => requests.at(-1).page).toBe(3);
    await el.locator('webui-pagination').first().locator('select').selectOption('50');
    await expect.poll(() => requests.at(-1)).toMatchObject({ perPage: 50, page: 1 });
});
test('a filter input sends its starting value with the first request', async ({ page }) => {
    const requests = [];
    await page.route('**/report-api', route => {
        requests.push(JSON.parse(route.request().postData()));
        return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ items: [{ Name: 'A' }], page: 1, total: 1 }) });
    });
    await mount(page, '<webui-input-range min="5" max="105" step="5" value="5" data-subscribe="report-start.recordCount:setValue" data-trigger="report-start.recordCount"></webui-input-range><webui-report api="http://localhost:3199/report-api" columns="Name" sort-column="Name" filters="report-start"></webui-report>');
    await expect.poll(() => requests.length).toBeGreaterThan(0);
    expect(requests[0]).toMatchObject({ recordCount: '5' });
});
test('action column templates escape row values from the api', async ({ page }) => {
    const message = '<img src=x onerror="window.__hacked=1"> & "quotes"';
    await page.route('**/report-api', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ items: [{ Name: 'A', Message: message }], page: 1, total: 1 }) }));
    const root = await mount(page, `<webui-report api="http://localhost:3199/report-api" columns="Name" sort-column="Name" append-columns=":Action:">
<template slot="column" name="action"><webui-button title="View {TEMPLATE_MESSAGE}" data-value="{TEMPLATE_ROWDATA}"></webui-button><pre>{TEMPLATE_MESSAGE}</pre></template>
</webui-report>`);
    const el = root.locator('webui-report');
    await expect(el.locator('td pre')).toHaveText(message);
    await expect(el.locator('td img')).toHaveCount(0);
    await expect(el.locator('td webui-button')).toHaveAttribute('title', `View ${message}`);
    expect(JSON.parse(await el.locator('td webui-button').getAttribute('data-value')).Message).toBe(message);
    expect(await page.evaluate(() => window.__hacked)).toBeUndefined();
});
