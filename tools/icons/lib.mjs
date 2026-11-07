// Geometry for building Web UI icons.
//
// A webui-icon path is always a start point, exactly 11 quadratic curves, and a close (z): 12 points in all, as
// the icon creator edits them. Browsers only animate between paths with the same commands, so keeping every
// path in this form lets any icon morph into any other. These helpers describe shapes with lines, arcs, and curves, then convert them to that form:
// straight lines become curves with their control point on the line, arcs become curves of at most 45 degrees,
// and the longest curves are split in half until there are 11. Splitting never changes the shape.
//
// Coordinates run from -100 to 100, with y pointing down and angles in degrees clockwise from the right.

export const SEGMENTS = 11;
const rad = deg => (deg * Math.PI) / 180;

/** A path being drawn. Every method returns the path, so calls can be chained. */
export class Path {
    constructor(x, y) {
        this.start = [x, y];
        this.cur = [x, y];
        this.segs = [];
        this.open = false;
    }
    /** A straight line. */
    L(x, y) {
        const [px, py] = this.cur;
        if (px === x && py === y) return this;
        this.segs.push([(px + x) / 2, (py + y) / 2, x, y]);
        this.cur = [x, y];
        return this;
    }
    /** A quadratic curve through control point (cx, cy). */
    Q(cx, cy, x, y) {
        this.segs.push([cx, cy, x, y]);
        this.cur = [x, y];
        return this;
    }
    /**
     * An arc around (cx, cy) from angle a0 to a1. The path first moves to the arc's start with a line if needed.
     * Each curve covers at most maxStep degrees: 45 is accurate to a fraction of a unit, 90 to about 1%.
     */
    A(cx, cy, r, a0, a1, maxStep = 45) {
        this.L(cx + r * Math.cos(rad(a0)), cy + r * Math.sin(rad(a0)));
        const pieces = Math.max(1, Math.ceil(Math.abs(a1 - a0) / maxStep));
        const step = (a1 - a0) / pieces;
        for (let i = 0; i < pieces; i++) {
            const from = a0 + step * i, to = from + step, mid = (from + to) / 2;
            const k = r / Math.cos(rad(step / 2));
            this.Q(cx + k * Math.cos(rad(mid)), cy + k * Math.sin(rad(mid)), cx + r * Math.cos(rad(to)), cy + r * Math.sin(rad(to)));
        }
        return this;
    }
    /** End a shape: a straight line back to the start, if it is not there already. */
    close() {
        this.L(...this.start);
        return this;
    }
    /** End a line drawing: it is traced back to its start, so the closing z adds nothing visible. */
    end() {
        this.open = true;
        return this;
    }
}

export const P = (x, y) => new Path(x, y);

/** Points a set distance from p toward q. */
function toward([px, py], [qx, qy], d) {
    const len = Math.hypot(qx - px, qy - py) || 1;
    return [px + ((qx - px) * d) / len, py + ((qy - py) * d) / len];
}

/**
 * Lines through points, with corners rounded by radius r. Closed shapes join the last point to the first.
 * A radius can be given per corner as a third value in a point, such as [x, y, 0] for a sharp corner.
 */
export function poly(points, { closed = true, r = 0 } = {}) {
    const pts = points.map(([x, y, cr]) => [x, y, cr ?? r]);
    const n = pts.length;
    const corner = i => {
        const p = pts[(i + n) % n], prev = pts[(i - 1 + n) % n], next = pts[(i + 1) % n];
        const cr = Math.min(p[2], Math.hypot(prev[0] - p[0], prev[1] - p[1]) / 2, Math.hypot(next[0] - p[0], next[1] - p[1]) / 2);
        return { p, cr, a: toward(p, prev, cr), b: toward(p, next, cr) };
    };
    if (closed) {
        // Start part way along the first edge, so every corner is rounded the same way.
        const c0 = corner(0);
        const path = c0.cr > 0 ? P(...c0.b) : P(pts[0][0], pts[0][1]);
        for (let i = 1; i <= n; i++) {
            const c = corner(i);
            if (c.cr > 0) path.L(...c.a).Q(c.p[0], c.p[1], ...c.b);
            else path.L(c.p[0], c.p[1]);
        }
        return path.close();
    }
    const path = P(pts[0][0], pts[0][1]);
    for (let i = 1; i < n - 1; i++) {
        const c = corner(i);
        if (c.cr > 0) path.L(...c.a).Q(c.p[0], c.p[1], ...c.b);
        else path.L(c.p[0], c.p[1]);
    }
    return path.L(pts[n - 1][0], pts[n - 1][1]).end();
}

export const line = (x1, y1, x2, y2) => P(x1, y1).L(x2, y2).end();
export const polyline = (points, r = 0) => poly(points, { closed: false, r });
export const polygon = (points, r = 0) => poly(points, { closed: true, r });

/** A rectangle from (x0, y0) to (x1, y1) with rounded corners. */
export const rect = (x0, y0, x1, y1, r = 0) => polygon([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], r);

/** A full circle, starting at angle `from`. */
export function circle(cx, cy, r, from = -90) {
    return P(cx + r * Math.cos(rad(from)), cy + r * Math.sin(rad(from))).A(cx, cy, r, from, from + 360).close();
}

/** An ellipse, drawn as a circle stretched along each axis. */
export function ellipse(cx, cy, rx, ry, from = -90) {
    const c = circle(0, 0, 1, from);
    return transform(c, ([x, y]) => [cx + x * rx, cy + y * ry]);
}

/** A small filled-looking dot, such as the point of an exclamation mark. */
// Radius 2 under a 10 unit stroke is a solid dot. Radius 3 rounds to a jagged outline that leaves a pinhole.
export const dot = (x, y, r = 2) => circle(x, y, r);

/** An arc drawn as a line, from angle a0 to a1. */
export const arc = (cx, cy, r, a0, a1) => {
    const path = P(cx + r * Math.cos(rad(a0)), cy + r * Math.sin(rad(a0)));
    return path.A(cx, cy, r, a0, a1).end();
};

/** A copy of a path with every point moved by fn([x, y]). Lines stay lines, and curves stay curves. */
export function transform(path, fn) {
    const out = P(...fn(path.start));
    out.segs = path.segs.map(([cx, cy, x, y]) => [...fn([cx, cy]), ...fn([x, y])]);
    out.cur = fn(path.cur);
    out.open = path.open;
    return out;
}
export const move = (path, dx, dy) => transform(path, ([x, y]) => [x + dx, y + dy]);
export const scale = (path, s, sy = s) => transform(path, ([x, y]) => [x * s, y * sy]);
export const rotate = (path, deg) => {
    const c = Math.cos(rad(deg)), s = Math.sin(rad(deg));
    return transform(path, ([x, y]) => [x * c - y * s, x * s + y * c]);
};
export const mirror = path => transform(path, ([x, y]) => [-x, y]);

/** Read a path written in the icon format (M then Q curves), so existing artwork can be reused or adjusted. */
export function parse(d) {
    const nums = d.replace(/[MQz]/g, ' ').trim().split(/\s+|(?=-)/).filter(Boolean).map(Number);
    const path = P(nums[0], nums[1]);
    for (let i = 2; i + 3 < nums.length; i += 4) path.Q(nums[i], nums[i + 1], nums[i + 2], nums[i + 3]);
    return path;
}

const splitQ = ([x0, y0], [cx, cy, x1, y1]) => {
    const ax = (x0 + cx) / 2, ay = (y0 + cy) / 2, bx = (cx + x1) / 2, by = (cy + y1) / 2;
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    return [[ax, ay, mx, my], [bx, by, x1, y1]];
};

/** The path's curves, closed, with open lines traced back to their start. */
function closedSegments(path) {
    const segs = path.segs.map(s => [...s]);
    if (!path.open) {
        const [lx, ly] = segs.length ? segs[segs.length - 1].slice(2) : path.start;
        if (Math.abs(lx - path.start[0]) > 1e-6 || Math.abs(ly - path.start[1]) > 1e-6) {
            segs.push([(lx + path.start[0]) / 2, (ly + path.start[1]) / 2, ...path.start]);
        }
        return segs;
    }
    const back = [];
    for (let i = segs.length - 1; i >= 0; i--) {
        const from = i === 0 ? path.start : segs[i - 1].slice(2);
        back.push([segs[i][0], segs[i][1], from[0], from[1]]);
    }
    return segs.concat(back);
}

/** Split the longest curves in half until there are exactly SEGMENTS. */
function fill(start, segs) {
    const out = segs.map(s => [...s]);
    while (out.length < SEGMENTS) {
        let best = 0, bestLen = -1, prev = start;
        out.forEach((s, i) => {
            const p0 = i === 0 ? start : out[i - 1].slice(2);
            const len = Math.hypot(s[0] - p0[0], s[1] - p0[1]) + Math.hypot(s[2] - s[0], s[3] - s[1]);
            if (len > bestLen) { bestLen = len; best = i; prev = p0; }
        });
        out.splice(best, 1, ...splitQ(prev, out[best]));
    }
    return out;
}

const num = v => {
    const n = Math.round(v);
    return Object.is(n, -0) ? 0 : n;
};

/**
 * Convert a path to icon lines. A line drawing with too many curves to trace back within 11 is split into
 * several lines, which meet with round caps. A closed shape with too many curves is an error, since splitting
 * it would draw extra edges.
 */
export function toLines(path, name) {
    let parts = [path];
    const half = Math.floor(SEGMENTS / 2);
    if (path.open && path.segs.length * 2 > SEGMENTS) {
        parts = [];
        for (let i = 0; i < path.segs.length; i += half) {
            const start = i === 0 ? path.start : path.segs[i - 1].slice(2);
            const part = P(...start);
            part.segs = path.segs.slice(i, i + half);
            part.open = true;
            parts.push(part);
        }
    }
    return parts.map(part => {
        const segs = closedSegments(part);
        if (segs.length > SEGMENTS) throw new Error(`${name}: a closed shape has ${segs.length} curves, more than ${SEGMENTS}`);
        const full = fill(part.start, segs);
        return `M${num(part.start[0])} ${num(part.start[1])}` + full.map(s => `Q${s.map(num).join(' ')}`).join('') + 'z';
    });
}
