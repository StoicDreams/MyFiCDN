/*
SVG Cheet Sheet - https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
path commands:
Uppercase uses absolute positioning, lowercase uses relative positioning, Z|z has no difference.
M|m: Move to point.
L|l: Draw line from current position to new position.
H|h: Draw horizontal line to X position.
V|v: Draw vertical line to absolute Y position.
C|c: Cubic Bezier curve (e.g. C x1 y1, x2, y2, x y).
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
    const notFoundDef = `WEBUI-ICON-NOT-FOUND
    M0 -70Q25 -45 25 -45Q45 -25 45 -25Q70 0 70 0Q50 20 50 20Q25 45 25 45Q0 70 0 70Q-35 35 -35 35Q-70 0 -70 0Q-45 -25 -45 -25Q-25 -45 -25 -45Q0 -70 0 -70z
    M0 -70Q25 -45 25 -45Q45 -25 45 -25Q70 0 70 0Q50 20 50 20Q25 45 25 45Q0 70 0 70Q-35 35 -35 35Q-70 0 -70 0Q-45 -25 -45 -25Q-25 -45 -25 -45Q0 -70 0 -70z
    M0 -70Q25 -45 25 -45Q45 -25 45 -25Q70 0 70 0Q50 20 50 20Q25 45 25 45Q0 70 0 70Q-35 35 -35 35Q-70 0 -70 0Q-45 -25 -45 -25Q-25 -45 -25 -45Q0 -70 0 -70z`;
    const pathCount = 8;
    const cache = {}, waiter = {};
    const srcRoot = webui.getData('appName') === 'MyFi CDN' ? '/icons/' : 'https://cdn.myfi.ws/icons/';
    const defCircle = 'M 0 -95 A 95 95 0 1 1 0 95 A 95 95 0 1 1 0 -95';
    const defSquare = 'M-95 -95 L -95 95 L 95 95 L 95 -95Z';
    const missing = {};
    function noteMissingIcon(name, ex) {
        if (missing[name]) return;
        missing[name] = true;
        console.log('missing icon', name, ex || '');
    }
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
                if (!result.ok) {
                    noteMissingIcon(name);
                    iconDef = notFoundDef;
                } else {
                    iconDef = await result.text();
                    if (!iconDef.startsWith("WEBUI-ICON-")) {
                        noteMissingIcon(name);
                        iconDef = notFoundDef;
                    } else {
                        iconDef = iconDef.replace(/\r/g, '');
                    }
                }
            } catch (ex) {
                noteMissingIcon(name, ex);
                iconDef = notFoundDef;
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
            t._backPath = t.template.querySelector('path.backing');
            t._dynPaths = [];
            for (let instance = 1; instance <= pathCount; ++instance) {
                t[`_i${instance}`] = t.template.querySelector(`path.i${instance}`);
                t._dynPaths.push(t[`_i${instance}`]);
            }
        },
        attr: ['width', 'height', 'shadow', 'icon', 'inverted', 'backing', 'circle', 'rotate'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'inverted':
                    break;
                case 'rotate':
                    let number = parseFloat(value);
                    if (number > 0 || number < 0) {
                        t._svg.style.transform = `rotate(${number}deg)`;
                    } else {
                        t._svg.style.transform = '';
                    }
                    break;
                case 'circle':
                    if (value === null) {
                        t._backPath.setAttribute('d', defSquare);
                    } else {
                        t._backPath.setAttribute('d', defCircle);
                    }
                    break;
                case 'icon':
                    if (!value) return;
                    let idata = value.split('|');
                    let icon = idata.shift();
                    idata.forEach(flag => {
                        let av = flag.split(':');
                        t.setAttribute(av[0], webui.getDefined(av[1], true));
                    });
                    getIcon(icon, (iconDef) => {
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
            defs.forEach(icoDef => {
                if (!icoDef) return;
                let segments = icoDef.split('|');
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
        setTheme(value) {
            let t = this;
            if (value) {
                t.style.setProperty('--theme-color', `var(--color-${value}-offset)`);
                t.style.setProperty('--theme-color-offset', `var(--color-${value})`);
            } else {
                t.style.removeProperty('--theme-color');
                t.style.removeProperty('--theme-color-offset');
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
<style></style>
</defs>
<path class="backing" d="M-95 -95 L -95 95 L 95 95 L 95 -95Z"></path>
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
--ico-color-border: var(--icon-default-border-color, none);
--ico-color-primary: var(--theme-color-offset, currentColor);
--ico-color-offset: var(--theme-color);
--ico-color-secondary: var(--ico-color-primary);
--ico-color-tertiary: var(--ico-color-primary);
--ico-stroke-width: var(--icon-stroke-width, 10);
--ico-height: var(--icon-height, 3ch);
--ico-transition-duration: var(--icon-transition-duration, 400ms);
display: inline-flex;
position: relative;
aspect-ratio:1;
align-items: center;
justify-items: center;
height: auto;
width: auto;
min-height: var(--ico-height);
margin:0;
padding:0;
}
svg {
width:auto;
height:100%;
fill: var(--ico-color-primary);
vertical-align: middle;
transition: all var(--ico-transition-duration) ease-in-out;
}
path {
transition: all var(--ico-transition-duration) ease-in-out;
fill:none;
stroke:var(--ico-color-primary);
stroke-width:var(--ico-stroke-width);
stroke-linecap:round;
stroke-linejoin: round;
}
path:not(.backing):nth-of-type(4n+3) {
stroke:var(--ico-color-tertiary);
}
path:not(.backing):nth-of-type(4n+4) {
stroke:var(--ico-color-secondary);
}
:host([fill]) path:not(.backing) {
fill:var(--ico-color-primary);
}
:host([fill]) path:not(.backing):nth-of-type(4n+3) {
fill:var(--ico-color-tertiary);
}
:host([fill]) path:not(.backing):nth-of-type(4n+4) {
fill:var(--ico-color-secondary);
}
:host([thin]) {
--ico-stroke-width: calc(0.5 * var(--icon-stroke-width, 10));
}
:host([thick]) {
--ico-stroke-width: calc(1.5 * var(--icon-stroke-width, 10));
}
:host([fill]) path,
:host([duo]) path {
--ico-color-secondary: color-mix(in srgb, var(--ico-color-primary) 50%, var(--ico-color-offset));
}
:host([fill]) path:not(.backing),
:host([duo][fill]) path:not(.backing),
:host([tri][fill]) path:not(.backing) {
fill:color-mix(in srgb, var(--ico-color-primary) 20%, var(--ico-color-offset));
}
:host([duo][fill]) path:not(.backing):nth-of-type(4n+3) {
fill:var(--ico-color-tertiary);
}
:host([duo][fill]) path:not(.backing):nth-of-type(4n+4) {
fill:var(--ico-color-secondary);
}
:host([tri]) path {
--ico-color-secondary: color-mix(in srgb, var(--ico-color-primary) 66%, var(--ico-color-offset));
--ico-color-tertiary: color-mix(in srgb, var(--ico-color-primary) 33%, var(--ico-color-offset));
}
:host([tri][fill]) path:not(.backing):nth-of-type(4n+3) {
fill:color-mix(in srgb, var(--ico-color-primary) 20%, var(--ico-color-offset));
}
:host([tri][fill]) path:not(.backing):nth-of-type(4n+4) {
fill:color-mix(in srgb, var(--ico-color-primary) 20%, var(--ico-color-offset));
}
:host([sharp]) path {
stroke-linecap:butt;
stroke-linejoin: miter;
}
path.backing {
stroke-width: var(--ico-stroke-width);
}
path.backing {
stroke: var(--ico-color-border);
}
:host([backing]) path.backing {
fill:color-mix(in srgb, var(--ico-color-primary) 20%, var(--ico-color-offset));
}
:host([inverted]) {
--ico-color-offset: var(--theme-color-offset, currentColor);
--ico-color-primary: var(--theme-color);
}
:host([inverted]) path.backing {
fill:var(--ico-color-offset);
}
:host([bordered]) path.backing {
--ico-color-border:var(--ico-color-primary);
}
:host(:not([circle]):not([inverted]):not([square]) path.backing),
path[d=""] {
display:none;
}
</style>`
    });
}
