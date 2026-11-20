import { test, expect } from './support/webui.mjs';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { FONTS, slug } from '../../tools/fonts/build.mjs';

// The fonts sites load from cdn/fonts, built by tools/fonts/build.mjs (npm run fonts).
const cdn = path => fileURLToPath(new URL(`../../cdn/fonts/${path}`, import.meta.url));

for (const { family } of FONTS) {
    const name = slug(family);
    test(`${family} has its stylesheet, minified, its license, and every file the stylesheet names`, () => {
        for (const file of [`${name}.css`, `${name}.min.css`, `${name}/OFL.txt`]) {
            expect(existsSync(cdn(file)), `${file} is missing: run npm run fonts, then PowerShell/Minify.ps1`).toBe(true);
        }
        for (const sheet of [`${name}.css`, `${name}.min.css`]) {
            const css = readFileSync(cdn(sheet), 'utf8');
            expect(css, `${sheet} still points at Google`).not.toMatch(/fonts\.gstatic\.com|fonts\.googleapis\.com/);
            expect(css).toContain(`font-family:${sheet.endsWith('.min.css') ? '' : ' '}`);
            const urls = [...css.matchAll(/url\(([^)]+)\)/g)].map(m => m[1].replace(/["']/g, ''));
            expect(urls.length).toBeGreaterThan(0);
            expect(urls.filter(url => !existsSync(cdn(url))), `${sheet} names files that are missing`).toEqual([]);
        }
    });
}
