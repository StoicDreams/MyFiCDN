// Prints the shape outlines in the format icon.js uses, a start point and 11 curves: node tools/icons/shapes.mjs
import { toLines } from './lib.mjs';
import { cloudOutline, fileOutline } from './parts.mjs';
for (const [name, path] of [['defCloud', cloudOutline()], ['defFile', fileOutline()]]) {
    console.log(`    const ${name} = '${toLines(path, name)[0]}';`);
}
