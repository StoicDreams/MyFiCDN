import { test, expect } from './support/webui.mjs';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// These fail when something new has no tests, naming exactly what is missing. A component's tests are in
// tests/unit/components/<name>.test.mjs, tests/browser/components/<name>.spec.mjs (what needs a real browser), or both.
const dir = path => fileURLToPath(new URL(path, import.meta.url));
const filesIn = (folder, ending) => existsSync(dir(folder)) ? readdirSync(dir(folder)).filter(name => name.endsWith(ending)) : [];
const componentFiles = readdirSync(dir('../../cdn/webui')).filter(name => name.endsWith('.js') && !name.endsWith('.min.js'));
const testedComponents = () => [
    ...filesIn('./components', '.test.mjs').map(name => name.replace('.test.mjs', '')),
    ...filesIn('../browser/components', '.spec.mjs').map(name => name.replace('.spec.mjs', '')),
];

test('every component has tests', () => {
    const tested = testedComponents();
    const missing = componentFiles.map(name => name.replace('.js', '')).filter(name => name !== 'loader' && !tested.includes(name));
    expect(missing).toEqual([]);
});

test('every component test file belongs to a component', () => {
    const missing = testedComponents().filter(name => !componentFiles.includes(`${name}.js`));
    expect(missing).toEqual([]);
});

test('every webui member is named in a test title', async ({ page }) => {
    const members = await page.evaluate(() => [...new Set([
        ...Object.getOwnPropertyNames(Object.getPrototypeOf(webui)),
        ...Object.keys(webui),
    ])].filter(name => name !== 'constructor' && !name.startsWith('_') && name !== 'loaded'));
    const folders = [['./methods', '.test.mjs'], ['./loader', '.test.mjs'], ['./components', '.test.mjs'],
        ['../browser/methods', '.spec.mjs'], ['../browser/loader', '.spec.mjs'], ['../browser/components', '.spec.mjs']];
    const titles = folders.flatMap(([folder, ending]) =>
        filesIn(folder, ending).map(name => readFileSync(dir(`${folder}/${name}`), 'utf8'))).join('\n');
    const missing = members.filter(name => !new RegExp(`webui\\.${name}\\b`).test(titles));
    expect(missing).toEqual([]);
});
