/*
SVG Cheet Sheet - https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
path commands:
Uppercase uses absolute positioning, lowercase uses relative positioning, Z|z has no difference.
M|m: Move to point.
L|l: Draw line from current position to new position.
H|h: Draw horizontal line to X position.
V|v: Draw vertical line to absolute Y position.
C|c: Cubic Bezier curve (e.g. B x1 y1, x2, y2, x y).
S|s: Shortcut for Cubic Bezier curve that follows a previous Bezier curve (e.g. S x1 y1, x y) and uses a reflection of the previous control point as the first control point.
Q|q: Quadratic Bezier curve (e.g. Q x1 x2, x y).
T|t: Shortcut for Quadratic Bezier curve that follows a previous Quadratic curve (e.g. T x y) and uses a reflection of the previous control point as the first control point.
A|a: Arc (e.g. A rx ry x-axis-rotation large-arc-flag sweep-flag x y)
Z|z: Close path - current to origin

Line caps: butt|square|round
Stroke line joins: miter|round|bevel
*/
"use strict"
{
    const pathCount = 8;
    const cache = {}, waiter = {};
    const srcRoot = webui.getData('appName') === 'MyFi CDN' ? '/icons/' : 'https://cdn.myfi.ws/icons/';

    async function getIcon(name, handler) {
        if (!name) {
            return '';
        }
        let iconDef = cache[name];
        if (iconDef) {
            handler(iconDef);
            return;
        }
        if (waiter[name]) {
            waiter[name].push(handler);
        } else {
            waiter[name] = [];
            try {
                let result = await fetch(`${srcRoot}${name}.webui`);
                if (!result.ok) return;
                iconDef = await result.text();
                if (!iconDef.startsWith("WEBUI-ICON-")) {
                    iconDef = '';
                } else {
                    iconDef = iconDef.replace(/\r/g, '');
                }
            } catch (ex) {
                console.error('Failed loading fa icon file', name, ex);
                iconDef = '';
            }
            cache[name] = iconDef;
            handler(iconDef);
            setTimeout(() => {
                waiter[name].forEach(h => h(iconDef));
                delete waiter[name];
            }, 10);
        }
    }
    webui.define('webui-icon', {
        preload: "",
        constructor: (t) => {
            t._svg = t.template.querySelector('svg');
            t._style = t.template.querySelector('defs style');
            t._clipPath = t.template.querySelector('path.clip');
            for (let instance = 1; instance <= pathCount; ++instance) {
                t[`_i${instance}`] = t.template.querySelector(`path.i${instance}`);
            }
        },
        attr: ['width', 'height', 'shadow', 'icon'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'icon':
                    if (!value) return;
                    getIcon(value, (iconDef) => {
                        t.setIconDefinition(iconDef);
                    });
                    break;
                case 'shadow':
                    t._svg.style.filter = `drop-shadow:${value}`;
                case 'width':
                    t.style.width = webui.pxIfNumber(value);
                    break;
                case 'height':
                    t.style.height = webui.pxIfNumber(value);
                    break;
            }
        },
        connected: (_t) => { },
        setIconDefinition(iconDef) {
            if (!iconDef || typeof iconDef !== 'string') return;
            let t = this;
            t._definition = iconDef;
            let defs = iconDef.split('\n');
            defs.shift();
            let instance = 0;
            t.setPathRule(t._clipPath, '');
            defs.forEach(icoDef => {
                if (!icoDef) return;
                let segments = icoDef.split('|');
                if (segments[0] === 'clip') {
                    segments.shift();
                    t.setPathRule(t._clipPath, segments.join('|'));
                    return;
                }
                let key = `_i${++instance}`;
                let path = t[key];
                if (!path) return;
                t.setPathRule(path, segments.join('|'));
            });
            while (instance < pathCount) {
                let key = `_i${++instance}`;
                let path = t[key];
                t.setPathRule(path, '');
            }
        },
        setPathRule(path, rule) {
            if (!rule) {
                path.setAttribute('d', '');
                return;
            }
            let segments = rule.split('|');
            if (segments.length > 1) {
                let stroke = segments.shift();
                path.style.stroke = stroke;
            }
            while (segments.length > 1) {
                segments.shift();

            }
            path.setAttribute('d', segments[0]);
        },
        clearPaths() {
            let t = this;
            for (let instance = 1; instance <= pathCount; ++instance) {
                let key = `_i${instance}`;
                t[key].setAttribute('d', '');
            }
        },
        shadowTemplate: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200">
<!--! Stoic Dreams - https://webui.stoicdreams.com License - https://webui.stoicdreams.com/license Copyright 2024 Stoic Dreams Inc. -->
<defs>
<clipPath>
<path class="clip" d=""></path>
</clipPath>
<style></style>
</defs>
<path class="i1" d=""></path>
<path class="i2" d=""></path>
<path class="i3" d=""></path>
<path class="i4" d=""></path>
<path class="i5" d=""></path>
<path class="i6" d=""></path>
<path class="i7" d=""></path>
<path class="i8" d=""></path>
</svg>
<style type="text/css">
:host {
--ico-primary-color: currentColor;
--ico-secondary-color: color-mix (in srgb, var(--ico-primary-color) 66%, transparent);
--ico-tertiary-color: color-mix (in srgb, var(--ico-primary-color) 33%, transparent);
--ico-stroke-width: 20;
--ico-transition-duration: var(--icon-transition-duration, 400ms);
display: inline-flex;
position: relative;
align-items: center;
justify-items: center;
height: auto;
width: auto;
min-height: 1em;
margin:auto;
padding:0;
}
svg {
width:auto;
height:100%;
fill: var(--ico-primary-color);
vertical-align: middle;
transition: all var(--ico-transition-duration) ease-in-out;
}
path {
transition: all var(--ico-transition-duration) ease-in-out;
fill:none;
stroke:currentColor;
stroke-width:var(--ico-stroke-width);
stroke-linecap:round;
stroke-linejoin: round;
}
:host([thin]) {
--ico-stroke-width: 15;
}
</style>`
    });
}
