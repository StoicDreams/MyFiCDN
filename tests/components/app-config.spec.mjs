import { test, expect, mount } from '../support/webui.mjs';

test('attributes become config and data', async ({ page }) => {
    await mount(page, '<webui-app-config test-setting="on"></webui-app-config>');
    await expect.poll(() => page.evaluate(() => [webui.appConfig.testSetting, webui.appConfig['test-setting'], webui.getData('test-setting')])).toEqual(['on', 'on', 'on']);
});
test('src loads config and data from json', async ({ page }) => {
    expect(await page.evaluate(() => [webui.appConfig.appApi, webui.getData('app-api')])).toEqual(['https://api.myfi.ws', 'https://api.myfi.ws']);
});
