import { test, expect } from './support/webui.mjs';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// These fail when something new has no tests, naming exactly what is missing.
const dir = path => fileURLToPath(new URL(path, import.meta.url));
const specFiles = folder => readdirSync(dir(folder)).filter(name => name.endsWith('.spec.mjs'));
const componentFiles = readdirSync(dir('../cdn/webui')).filter(name => name.endsWith('.js') && !name.endsWith('.min.js'));

test('every component has a spec file', () => {
    const specs = specFiles('./components').map(name => name.replace('.spec.mjs', ''));
    const missing = componentFiles.map(name => name.replace('.js', '')).filter(name => name !== 'loader' && !specs.includes(name));
    expect(missing).toEqual([]);
});

test('every spec file belongs to a component', () => {
    const missing = specFiles('./components').filter(name => !componentFiles.includes(name.replace('.spec.mjs', '.js')));
    expect(missing).toEqual([]);
});

test('every webui member is named in a test title', async ({ page }) => {
    const members = await page.evaluate(() => [...new Set([
        ...Object.getOwnPropertyNames(Object.getPrototypeOf(webui)),
        ...Object.keys(webui),
    ])].filter(name => name !== 'constructor' && !name.startsWith('_') && name !== 'loaded'));
    const titles = ['./methods', './loader', './components'].flatMap(folder =>
        specFiles(folder).map(name => readFileSync(dir(`${folder}/${name}`), 'utf8'))).join('\n');
    const missing = members.filter(name => !new RegExp(`webui\\.${name}\\b`).test(titles));
    expect(missing).toEqual([]);
});
