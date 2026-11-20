// Copies the Google Fonts the sites use into cdn/fonts, so every site loads them from cdn.myfi.ws instead of Google.
// Each family gets cdn/fonts/{slug}.css (the @font-face rules, minified by PowerShell/Minify.ps1), its woff2 files in
// cdn/fonts/{slug}/, and its license. Add a family or weight to FONTS, then run: npm run fonts
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'cdn', 'fonts');

// family: the Google Fonts name. axes: the part after the colon in a css2 request. license: its folder in github.com/google/fonts.
export const FONTS = [
    { family: 'Caveat', axes: 'wght@600;700', license: 'ofl/caveat/OFL.txt' },
    { family: 'Cinzel', axes: 'wght@500;600;700', license: 'ofl/cinzel/OFL.txt' },
    { family: 'Cormorant Garamond', axes: 'ital,wght@0,500;1,400;1,500', license: 'ofl/cormorantgaramond/OFL.txt' },
    { family: 'EB Garamond', axes: 'ital,wght@0,400;0,500;1,400', license: 'ofl/ebgaramond/OFL.txt' },
    { family: 'Inter', axes: 'wght@400;500;600;700', license: 'ofl/inter/OFL.txt' },
    { family: 'Marcellus', axes: '', license: 'ofl/marcellus/OFL.txt' },
    { family: 'Montserrat', axes: 'wght@500', license: 'ofl/montserrat/OFL.txt' },
    { family: 'Nunito', axes: 'wght@600;700;800;900', license: 'ofl/nunito/OFL.txt' },
    { family: 'Pixelify Sans', axes: 'wght@500;700', license: 'ofl/pixelifysans/OFL.txt' },
    { family: 'Sora', axes: 'wght@500;600;700', license: 'ofl/sora/OFL.txt' },
    { family: 'Source Sans 3', axes: 'wght@400;600', license: 'ofl/sourcesans3/OFL.txt' },
];

// Google sends woff2 with unicode-range subsets only to browsers it knows support them.
const BROWSER = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

export const slug = family => family.toLowerCase().replace(/[^a-z0-9]+/g, '-');

async function get(url, as) {
    for (let attempt = 1; ; attempt++) {
        try {
            const response = await fetch(url, { headers: { 'user-agent': BROWSER } });
            if (!response.ok) throw new Error(`${response.status} ${url}`);
            return as === 'text' ? await response.text() : Buffer.from(await response.arrayBuffer());
        } catch (error) {
            if (attempt >= 3) throw error;
        }
    }
}

async function build(font) {
    const name = slug(font.family);
    const query = `family=${font.family.replace(/ /g, '+')}${font.axes ? `:${font.axes}` : ''}&display=swap`;
    let css = await get(`https://fonts.googleapis.com/css2?${query}`, 'text');
    const folder = join(OUT, name);
    rmSync(folder, { recursive: true, force: true });
    mkdirSync(folder, { recursive: true });
    const files = new Map();
    for (const [, url] of css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)) {
        if (!files.has(url)) files.set(url, `${name}/${files.size + 1}.woff2`);
    }
    for (const [url, file] of files) {
        writeFileSync(join(OUT, file), await get(url));
        css = css.replaceAll(url, file);
    }
    writeFileSync(join(folder, 'OFL.txt'), await get(`https://raw.githubusercontent.com/google/fonts/main/${font.license}`));
    writeFileSync(join(OUT, `${name}.css`), `/* ${font.family} from Google Fonts, under the SIL Open Font License (${name}/OFL.txt). Built by tools/fonts/build.mjs. */\n${css}`);
    console.log(`${font.family}: ${files.size} files`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    mkdirSync(OUT, { recursive: true });
    for (const font of FONTS) await build(font);
}
