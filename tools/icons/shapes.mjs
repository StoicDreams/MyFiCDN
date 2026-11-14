// Prints the shape outlines in the format icon.js uses: node tools/icons/shapes.mjs
// Most are a start point and 11 curves, so one shape morphs into another. The gear and calendar have more, and only swap.
import { toLines } from './lib.mjs';
import { cloudOutline, fileOutline, bookOutline, gearOutline, chartOutline, calendarOutline, heartOutline } from './parts.mjs';
for (const [name, path] of [['defCloud', cloudOutline()], ['defFile', fileOutline()], ['defBook', bookOutline()], ['defChart', chartOutline()], ['defHeart', heartOutline()]]) {
    console.log(`    const ${name} = '${toLines(path, name)[0]}';`);
}
const r = n => Math.round(n);
for (const [name, path] of [['defGear', gearOutline()], ['defCalendar', calendarOutline()]]) {
    console.log(`    const ${name} = 'M${path.start.map(r).join(' ')}${path.segs.map(([cx, cy, x, y]) => `Q${r(cx)} ${r(cy)} ${r(x)} ${r(y)}`).join('')}z';`);
}
