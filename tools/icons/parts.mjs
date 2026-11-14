// Shared building blocks for icon designs. See icons.mjs for the style they follow.
import { P, line, polyline, polygon, rect, circle, arc, rotate } from './lib.mjs';

export const rad = deg => (deg * Math.PI) / 180;
export const at = (cx, cy, r, deg) => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];

/** An arrow head with its tip at (x, y), pointing toward angle `deg`. */
export function head(x, y, deg, len = 30, spread = 45) {
    return polyline([at(x, y, len, deg + 180 - spread), [x, y], at(x, y, len, deg + 180 + spread)]);
}

/** An arc with an arrow head at its end. Angles run clockwise when a1 > a0. */
export function curvedArrow(cx, cy, r, a0, a1) {
    const [x, y] = at(cx, cy, r, a1);
    const forward = a1 > a0 ? a1 + 90 : a1 - 90;
    return [arc(cx, cy, r, a0, a1), head(x, y, forward, 28)];
}

/** A curved arrow whose arc is in the second shade, so Shade sets the head apart. */
export function shadedArrow(cx, cy, r, a0, a1) {
    const [shaft, tip] = curvedArrow(cx, cy, r, a0, a1);
    return [bi(shaft), tip];
}

export const bi = path => ['bi', path];
export const tri = path => ['tri', path];

// Shared parts.
export const box = (r = 12) => rect(-64, -64, 64, 64, r);
export const ring = (r = 70) => circle(0, 0, r);
export const lens = () => circle(-14, -14, 46);
export const lensHandle = () => line(20, 20, 62, 62);
export const personHead = (x = 0, y = -36, r = 26) => circle(x, y, r);
export const shoulders = (x = 0, y = 8, w = 58, bottom = 64) => P(x - w, bottom).Q(x - w, y, x, y).Q(x + w, y, x + w, bottom).close();
export const bubble = () => polygon([[-66, -56, 12], [66, -56, 12], [66, 30, 12], [-8, 30, 0], [-40, 62, 0], [-38, 30, 0], [-66, 30, 12]]);
export const docShape = () => polygon([[-48, -68, 10], [16, -68, 0], [52, -32, 0], [52, 68, 10], [-48, 68, 10]]);
export const docFold = () => polyline([[16, -68], [16, -32], [52, -32]]);
export const shieldShape = () => P(0, -70).Q(34, -54, 62, -54).L(62, -8).Q(62, 44, 0, 70).Q(-62, 44, -62, -8).L(-62, -54).Q(-34, -54, 0, -70);
export const trayLine = () => polyline([[-64, 28], [-64, 62], [64, 62], [64, 28]], 10);
export const play = () => polygon([[-36, -58], [56, 0], [-36, 58]], 12);
export const eyeShape = () => P(-72, 0).Q(-38, -48, 0, -48).Q(38, -48, 72, 0).Q(38, 48, 0, 48).Q(-38, 48, -72, 0);
export const speaker = () => polygon([[-66, -22, 6], [-36, -22, 0], [4, -58, 6], [4, 58, 6], [-36, 22, 0], [-66, 22, 6]]);

/** A crescent moon: an outer arc between two tips, and an inner arc back that bulges the same way. */
export function crescent() {
    const R = 66, a0 = -100, a1 = 150;
    const A = at(0, 0, R, a0), B = at(0, 0, R, a1);
    // The inner circle passes through both tips, with its center pushed out toward the top left.
    const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    const len = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const normal = [(B[1] - A[1]) / len, -(B[0] - A[0]) / len];
    const c = [mid[0] - normal[0] * 30, mid[1] - normal[1] * 30];
    const r = Math.hypot(A[0] - c[0], A[1] - c[1]);
    const angB = (Math.atan2(B[1] - c[1], B[0] - c[0]) * 180) / Math.PI;
    let delta = (Math.atan2(A[1] - c[1], A[0] - c[0]) * 180) / Math.PI - angB;
    while (delta > 180) delta -= 360;
    while (delta <= -180) delta += 360;
    return P(...A).A(0, 0, R, a0, a1).A(c[0], c[1], r, angB, angB + delta).close();
}

/** A sun ray at angle deg. */
export const ray = (deg, r0 = 44, r1 = 68) => line(...at(0, 0, r0, deg), ...at(0, 0, r1, deg));

/** A rounded rectangle tilted around the origin. */
export const tilted = (x0, y0, x1, y1, r, deg) => rotate(rect(x0, y0, x1, y1, r), deg);

/**
 * A smooth curve through points: each point pulls the curve toward it, and the curve passes through the midpoints
 * between them. Good for organic shapes such as flames and leaves. Closed shapes use one curve per point.
 */
export function smooth(points, closed = true) {
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (closed) {
        const n = points.length;
        const path = P(...mid(points[n - 1], points[0]));
        points.forEach((p, i) => path.Q(...p, ...mid(p, points[(i + 1) % n])));
        return path;
    }
    const path = P(...points[0]);
    for (let i = 1; i < points.length - 1; i++) {
        const end = i === points.length - 2 ? points[i + 1] : mid(points[i], points[i + 1]);
        path.Q(...points[i], ...end);
    }
    return path.end();
}

/** A four pointed sparkle centered on (cx, cy). */
export const sparkle = (cx, cy, r, inner = r * 0.28) =>
    polygon(Array.from({ length: 8 }, (_, i) => at(cx, cy, i % 2 ? inner : r, -90 + 45 * i)));

// The outlines webui-icon draws for shape:cloud and shape:file. The icon sits at 0.62 scale inside a shape, within
// about ±47, so both leave that square clear. tools/icons/shapes.mjs prints them for icon.js.
const meet = ([x1, y1, r1], [x2, y2, r2], outer) => {
    // Where two circles cross, on the side away from the point outer.
    const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy);
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h = Math.sqrt(r1 * r1 - a * a);
    const mx = x1 + (a * dx) / d, my = y1 + (a * dy) / d;
    const options = [[mx - (h * dy) / d, my + (h * dx) / d], [mx + (h * dy) / d, my - (h * dx) / d]];
    return options.sort((p, q) => Math.hypot(q[0] - outer[0], q[1] - outer[1]) - Math.hypot(p[0] - outer[0], p[1] - outer[1]))[0];
};
const angle = ([cx, cy], [x, y]) => (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
/** A cloud with a flat base: a small lobe on each side of a large one. */
export function cloudOutline() {
    const left = [-56, 36, 38], top = [2, -14, 62], right = [56, 34, 40];
    const lt = meet(left, top, [0, 40]), tr = meet(top, right, [0, 40]);
    const norm = (a, from) => { while (a < from) a += 360; return a; };
    const l1 = norm(angle(left, lt), 90);
    const t0 = angle(top, lt), t1 = norm(angle(top, tr), norm(t0, 0));
    const r0 = angle(right, tr), r1 = norm(90, norm(r0, 0));
    const path = P(left[0], left[1] + left[2])
        .A(...left, 90, l1, 65)
        .A(...top, norm(t0, 0), t1, 65)
        .A(...right, norm(r0, 0), r1, 65)
        .close();
    // Each arc starts with a line to its first point, which is only a rounding error long where the lobes meet.
    let prev = [path.segs[0] ? left[0] : 0, left[1] + left[2]];
    path.segs = path.segs.filter(seg => {
        const keep = Math.hypot(seg[2] - prev[0], seg[3] - prev[1]) > 0.5;
        if (keep) prev = [seg[2], seg[3]];
        return keep;
    });
    return path;
}
/** A page with its top right corner folded over. The fold is traced first, so it draws as a line. */
export function fileOutline() {
    return P(40, -92).L(40, -62).L(70, -62).L(40, -92).L(-58, -92).Q(-70, -92, -70, -80).L(-70, 80).Q(-70, 92, -58, 92)
        .L(58, 92).Q(70, 92, 70, 80).L(70, -62).close();
}
