import { test, expect } from '../support/webui.mjs';

test('webui.getData reads app and session data', async ({ page }) => {
    const result = await page.evaluate(() => {
        webui.setData('my-key', 'a');
        webui.setData('session-other', 'b');
        return [
            webui.getData('my-key'),
            webui.getData('myKey'),
            webui.getData('my-key:setter'),
            webui.getData('session-other'),
            webui.getData('other'),
            webui.getData('name'),
            webui.getData('my-key', 'session-other'),
        ];
    });
    expect(result).toEqual(['a', 'a', 'a', 'b', 'b', 'My Fidelity CDN', ['a', 'b']]);
});
test('webui.getData returns copies, not live objects', async ({ page }) => {
    expect(await page.evaluate(() => {
        webui.setData('obj', { a: 1 });
        webui.getData('obj').a = 2;
        return webui.getData('obj').a;
    })).toBe(1);
});
test('webui.setData stores nested paths', async ({ page }) => {
    expect(await page.evaluate(() => {
        webui.setData('tree.branch.leaf', 5);
        return [webui.getData('tree.branch.leaf'), webui.getData('tree').branch.leaf];
    })).toEqual([5, 5]);
});
test('webui.setData removes values set to null or undefined', async ({ page }) => {
    expect(await page.evaluate(() => {
        webui.setData('gone', 1);
        webui.setData('gone', undefined);
        return webui.getData('gone') === undefined;
    })).toBe(true);
});
test('webui.setData treats camelCase session keys as session data', async ({ page }) => {
    expect(await page.evaluate(() => {
        webui.setData('sessionFooBar', 5);
        return webui.getData('session-foo-bar');
    })).toBe(5);
});
test('webui.setData saves nested session data', async ({ page }) => {
    await page.evaluate(() => {
        webui.setData('session-nest.a', 1);
        webui.setData('session-nest.b', 2);
    });
    await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem('session-data'))['session-nest'])).toEqual({ a: 1, b: 2 });
});
test('webui.setData blocks prototype pollution', async ({ page }) => {
    expect(await page.evaluate(() => {
        webui.setData('__proto__.polluted', 1);
        webui.setData('constructor.prototype.polluted2', 1);
        return [({}).polluted, ({}).polluted2];
    })).toEqual([undefined, undefined]);
});
test('webui.setData only sets reserved app keys once', async ({ page }) => {
    expect(await page.evaluate(() => {
        webui.setData('app-name', 'Changed');
        return webui.getData('app-name');
    })).toBe('My Fidelity CDN');
});
test('webui.setDefault only fills missing data', async ({ page }) => {
    expect(await page.evaluate(() => {
        webui.setData('set-key', 'keep');
        webui.setDefault('set-key', 'no');
        webui.setDefault('new-key', 'yes');
        webui.setDefault({ 'obj-key': 1 });
        return [webui.getData('set-key'), webui.getData('new-key'), webui.getData('obj-key')];
    })).toEqual(['keep', 'yes', 1]);
});
test('webui.setDefaultData fills missing fields with copies', async ({ page }) => {
    expect(await page.evaluate(() => webui.setDefaultData({ a: 1, b: null }, { a: 2, b: 3, c: 4 }))).toEqual({ a: 1, b: 3, c: 4 });
});
test('webui.getNestedData reads dot paths in either case style', async ({ page }) => {
    expect(await page.evaluate(() => {
        const data = { 'first-key': { secondKey: 5 } };
        return [webui.getNestedData('firstKey.secondKey', data), webui.getNestedData('first-key.missing.x', data) === undefined];
    })).toEqual([5, true]);
});
test('webui.clone deep copies', async ({ page }) => {
    expect(await page.evaluate(() => {
        const original = { one: [1, 2] };
        const copy = webui.clone(original);
        original.one.shift();
        return [copy, webui.clone(5), webui.clone(null)];
    })).toEqual([{ one: [1, 2] }, 5, null]);
});
test('webui.watchData reports changes on the returned proxy', async ({ page }) => {
    expect(await page.evaluate(() => {
        const seen = [];
        const proxy = webui.watchData({ a: 1 }, change => seen.push([change.type, change.property]));
        proxy.a = 2;
        proxy.b = 3;
        delete proxy.a;
        proxy.b = 3;
        return seen;
    })).toEqual([['update', 'a'], ['add', 'b'], ['delete', 'a']]);
});
test('webui.watchAppDataChanges and webui.unwatchAppDataChanges control app notifications', async ({ page }) => {
    expect(await page.evaluate(() => {
        const seen = [];
        const handler = change => seen.push(change.property);
        webui.watchAppDataChanges(handler);
        webui.setData('watch-one', 1);
        webui.unwatchAppDataChanges(handler);
        webui.setData('watch-two', 1);
        return seen;
    })).toEqual(['watch-one']);
});
test('webui.watchSessionDataChanges and webui.unwatchSessionDataChanges control session notifications', async ({ page }) => {
    expect(await page.evaluate(() => {
        const seen = [];
        const handler = change => seen.push(change.property);
        webui.watchSessionDataChanges(handler);
        webui.setData('session-watch-one', 1);
        webui.unwatchSessionDataChanges(handler);
        webui.setData('session-watch-two', 1);
        return seen;
    })).toEqual(['session-watch-one']);
});
test('webui.storage reads and writes through to the browser', async ({ page }) => {
    expect(await page.evaluate(() => {
        webui.storage.setItem('k', 'v');
        const found = webui.storage.key('k');
        const missing = webui.storage.key('nope');
        const value = webui.storage.getItem('k');
        webui.storage.removeItem('k');
        return [found, missing, value, webui.storage.getItem('k')];
    })).toEqual(['k', null, 'v', '']);
});
test('webui.storage moves data when local storage is accepted', async ({ page }) => {
    await page.evaluate(() => {
        webui.storage.setItem('kept', 'yes');
        webui.storage.acceptLocalStorage();
    });
    await expect.poll(() => page.evaluate(() => localStorage.getItem('kept'))).toBe('yes');
    await page.evaluate(() => webui.storage.acceptSessionStorage());
    await expect.poll(() => page.evaluate(() => [localStorage.getItem('kept'), sessionStorage.getItem('kept')])).toEqual([null, 'yes']);
});
test('webui.storage only writes to the storage the user chose', async ({ page }) => {
    const stored = () => page.evaluate(() => [localStorage.getItem('choice-test'), sessionStorage.getItem('choice-test')]);
    await page.evaluate(() => {
        webui.storage.acceptLocalStorage();
        webui.storage.setItem('choice-test', 'long');
    });
    expect(await stored()).toEqual(['long', null]);
    await page.evaluate(() => {
        webui.storage.acceptSessionStorage();
        webui.storage.setItem('choice-test', 'short');
    });
    expect(await stored()).toEqual([null, 'short']);
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});
test('webui.storage keeps the choice after a reload', async ({ page }) => {
    await page.evaluate(() => {
        webui.storage.acceptLocalStorage();
        webui.storage.setItem('choice-test', 'long');
    });
    await page.reload();
    await page.waitForFunction(() => typeof webui === 'object' && webui.loaded);
    expect(await page.evaluate(() => [webui.storage.getItem('choice-test'), localStorage.getItem('choice-test')])).toEqual(['long', 'long']);
    await page.evaluate(() => webui.storage.acceptSessionStorage());
    await page.reload();
    await page.waitForFunction(() => typeof webui === 'object' && webui.loaded);
    expect(await page.evaluate(() => [webui.storage.getItem('choice-test'), localStorage.getItem('choice-test')])).toEqual(['long', null]);
});
test('webui.storage.clear empties the chosen storage', async ({ page }) => {
    expect(await page.evaluate(() => {
        webui.storage.setItem('gone', 'x');
        webui.storage.clear();
        return [webui.storage.getItem('gone'), sessionStorage.getItem('gone')];
    })).toEqual(['', null]);
});
test('webui.appConfig holds the loaded config', async ({ page }) => {
    expect(await page.evaluate(() => [webui.appConfig.appName, webui.appConfig.rolesApi])).toEqual(['My Fidelity CDN', 'user/roles']);
});
test('webui.appSrc and webui.appMin locate site components', async ({ page }) => {
    expect(await page.evaluate(() => [webui.appSrc, webui.appMin])).toEqual(['/wc', '.min']);
});
test('webui.isLocalhost is true on localhost', async ({ page }) => {
    expect(await page.evaluate(() => webui.isLocalhost)).toBe(true);
});
test('webui.isSignedIn checks the user role bit', async ({ page }) => {
    expect(await page.evaluate(() => {
        const check = role => { webui.setData('session-user-role', role); return webui.isSignedIn; };
        return [check(0), check(1), check(2), check(3)];
    })).toEqual([false, true, false, true]);
});
test('webui.hasRole and webui.userRoles use role bits', async ({ page }) => {
    expect(await page.evaluate(() => {
        webui.setData('session-user-role', 5);
        return [webui.userRoles, webui.hasRole(4), webui.hasRole(1), webui.hasRole(2)];
    })).toEqual([5, true, true, false]);
});
test('webui.roles maps role names to bits', async ({ page }) => {
    await expect.poll(() => page.evaluate(() => Object.keys(webui.roles).length)).toBeGreaterThan(0);
    expect(await page.evaluate(() => Object.isFrozen(webui.roles))).toBe(true);
});
test('webui.loadRoles applies the API response', async ({ page }) => {
    await page.route('https://api.myfi.ws/user/roles', route => route.fulfill({
        status: 200,
        body: '5',
        headers: {
            'access-control-allow-origin': 'http://localhost:3199',
            'access-control-allow-credentials': 'true',
            'access-control-expose-headers': 'x-cookie-age',
            'x-cookie-age': '45',
        },
    }));
    expect(await page.evaluate(async () => {
        await webui.loadRoles();
        return [webui.getData('session-user-role'), webui.getData('session-autosignout')];
    })).toEqual([5, 45]);
});
