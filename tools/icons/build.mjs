// Write the icons in icons.mjs to cdn/icons as .webui files, and list every icon in cdn/icons/all.json.
//   node tools/icons/build.mjs          write the icons
//   node tools/icons/build.mjs --check  only report problems
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ICONS as BASE, KEEP } from './icons.mjs';
import { MORE } from './icons-more.mjs';
import { SETS } from './icons-sets.mjs';
import { toLines, Path } from './lib.mjs';

const OUT = fileURLToPath(new URL('../../cdn/icons/', import.meta.url));
const MAX_PATHS = 10;
const check = process.argv.includes('--check');

const ICONS = [...BASE, ...MORE, ...SETS];
const problems = [];
const seen = new Set();
for (const [name] of ICONS) {
    if (seen.has(name) || KEEP.includes(name)) problems.push(`${name}: defined more than once`);
    seen.add(name);
}

// webui-icon draws slashes (ban), containers (shape with bordered or backing), turns (rotate), and mirrors (flip)
// itself, so an icon that is only one of those applied to another icon should be a flag combination instead,
// such as eye|ban, circle_check|bordered, arrow|rotate:90, or undo|flip.
const SEPARATE_DESIGNS = ['align-left', 'align-right'];
const names = new Set(ICONS.map(([name]) => name));
for (const [name] of ICONS) {
    if (SEPARATE_DESIGNS.includes(name)) continue;
    const direction = name.match(/^(.+)-(left|up|down)$/);
    if (/-slash$/.test(name)) problems.push(`${name}: use the base icon with ban, such as eye|ban`);
    else if (/^(circle|square|shield|triangle|cloud|file)-/.test(name)) problems.push(`${name}: use the base icon with shape and bordered, such as circle_check|bordered or file_code|bordered`);
    else if (/-(vertical|horizontal)$/.test(name) && names.has(name.replace(/-(vertical|horizontal)$/, ''))) problems.push(`${name}: use ${name.replace(/-(vertical|horizontal)$/, '')} with rotate`);
    else if (direction && (names.has(direction[1]) || names.has(`${direction[1]}-right`))) problems.push(`${name}: use ${direction[1]} with rotate or flip`);
}
const written = {};
for (const [name, tags, ...parts] of ICONS) {
    const lines = [];
    for (const part of parts) {
        const [shade, path] = part instanceof Path ? ['', part] : part;
        try {
            for (const d of toLines(path, name)) lines.push(shade ? `${shade}|${d}` : d);
        } catch (error) {
            problems.push(error.message);
        }
    }
    if (lines.length > MAX_PATHS) problems.push(`${name}: ${lines.length} paths, more than ${MAX_PATHS}`);
    for (const l of lines) {
        const nums = l.replace(/^\w+\|/, '').match(/-?\d+/g).map(Number);
        if (nums.some(n => n < -100 || n > 100)) problems.push(`${name}: a point is outside -100 to 100`);
    }
    written[name] = { tags, text: [`WEBUI-ICON-${name.toUpperCase()}`, ...lines].join('\n') };
}
for (const name of KEEP) {
    if (!existsSync(`${OUT}${name}.webui`)) problems.push(`${name}: kept icon is missing`);
}
if (problems.length) {
    console.error(problems.join('\n'));
    process.exit(1);
}
if (check) {
    console.log(`${Object.keys(written).length} icons are valid`);
    process.exit(0);
}
for (const [name, { text }] of Object.entries(written)) writeFileSync(`${OUT}${name}.webui`, text);

// The index keeps tags already written for an icon, adding any new ones.
const index = JSON.parse(readFileSync(`${OUT}all.json`, 'utf8'));
const byName = new Map(index.map(entry => [entry.name, entry]));
for (const [name, { tags }] of Object.entries(written)) {
    const old = byName.get(name)?.tags?.split(/\s+/).filter(Boolean) || [];
    const merged = [...new Set([...old, ...tags.split(/\s+/).filter(Boolean)])].join(' ');
    byName.set(name, { name, tags: merged });
}
const files = readdirSync(OUT).filter(f => f.endsWith('.webui')).map(f => f.slice(0, -6));
for (const name of files) if (!byName.has(name)) byName.set(name, { name, tags: '' });
const list = [...byName.values()].filter(entry => files.includes(entry.name)).sort((a, b) => a.name.localeCompare(b.name));
writeFileSync(`${OUT}all.json`, JSON.stringify(list, null, 4) + '\n');
console.log(`Wrote ${Object.keys(written).length} icons, kept ${KEEP.length}, ${list.length} in all.json`);
