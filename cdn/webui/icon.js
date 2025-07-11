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
    const srcRoot = webui.getData('appName') === 'My Fidelity CDN' ? '/icons/' : 'https://cdn.myfi.ws/icons/';
    const defUnused = 'M0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0z';
    const defShield = 'M-90 -25Q-90 -75 -90 -75Q-40 -75 0 -90Q50 -75 90 -75Q90 -30 90 -30Q90 -20 90 -20Q90 0 90 0Q90 25 60 50Q0 90 0 90Q-60 50 -60 50Q-90 25 -90 0Q-90 -15 -90 -15z';
    const defBadge = 'M-28 68Q0 115 28 68Q86 86 68 28Q115 0 68 -28Q86 -86 28 -68Q1 -115 -28 -68Q-86 -86 -68 -28Q-115 0 -68 28Q-86 86 -28 68Q-28 68 -28 68Q-28 68 -28 68Q-28 68 -28 68z';
    const defCircle = 'M1 -93Q31 -91 53 -76Q76 -59 86 -35Q95 -12 92 13Q89 37 72 59Q58 76 37 86Q10 97 -16 92Q-45 85 -64 68Q-85 47 -92 16Q-96 -10 -87 -34Q-76 -60 -56 -75Q-26 -94 1 -93z';
    const defSquare = 'M0 -95Q80 -95 80 -95Q95 -95 95 -80Q95 0 95 0Q95 80 95 80Q95 95 80 95Q0 95 0 95Q-80 95 -80 95Q-95 95 -95 80Q-95 0 -95 0Q-95 -80 -95 -80Q-95 -95 -80 -95z';
    const defTriangle = 'M0 -90Q20 -55 20 -55Q40 -20 40 -20Q55 5 55 5Q90 65 90 65Q60 65 60 65Q0 65 0 65Q-55 65 -55 65Q-90 65 -90 65Q-55 5 -55 5Q-40 -20 -40 -20Q-20 -55 -20 -55z';
    const defTallTriangle = 'M0 -90Q25 -40 25 -40Q40 -10 40 -10Q55 20 55 20Q90 90 90 90Q60 90 60 90Q0 90 0 90Q-55 90 -55 90Q-90 90 -90 90Q-50 10 -50 10Q-30 -30 -30 -30Q-15 -60 -15 -60z';
    const defOcto = `M0 -90Q40 -90 40 -90Q90 -40 90 -40Q90 0 90 0Q90 40 90 40Q40 90 40 90Q0 90 0 90Q-40 90 -40 90Q-90 40 -90 40Q-90 0 -90 0Q-90 -40 -90 -40Q-40 -90 -40 -90z`;
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
            t._countSlot = t.template.querySelector('slot[name=count]');
            t._style = t.template.querySelector('defs style');
            t._backPath = t.template.querySelector('path.backing');
            t._dynPaths = [];
            for (let instance = 1; instance <= pathCount; ++instance) {
                t[`_i${instance}`] = t.template.querySelector(`path.i${instance}`);
                t._dynPaths.push(t[`_i${instance}`]);
            }
        },
        attr: ['width', 'height', 'shadow', 'icon', 'inverted', 'backing', 'shape', 'rotate', 'count', 'stroke', 'shade'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'count':
                    let num = parseInt(value) || 0;
                    if (num > 0) {
                        t._countSlot.innerHTML = num.toLocaleString();
                    } else {
                        t._countSlot.innerHTML = value;
                    }
                    break;
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
                case 'shape':
                    switch (value) {
                        case 'octo':
                        case 'octogon':
                            t._backPath.setAttribute('d', defOcto);
                            break;
                        case 'tri':
                        case 'triangle':
                            t._backPath.setAttribute('d', defTriangle);
                            break;
                        case 'badge':
                            t._backPath.setAttribute('d', defBadge);
                            break;
                        case 'circle':
                            t._backPath.setAttribute('d', defCircle);
                            break;
                        case 'shield':
                            t._backPath.setAttribute('d', defShield);
                            break;
                        default:
                            t._backPath.setAttribute('d', defSquare);
                            break;
                    }
                    break;
                case 'stroke':
                    if (!value) {
                        t.style.removeProperty('--ico-stroke-width');
                    }
                    switch (value) {
                        case 'thin':
                            t._svg.style.setProperty('--ico-stroke-width', '5');
                            break;
                        case 'thick':
                            t._svg.style.setProperty('--ico-stroke-width', '15');
                            break;
                        default:
                            t._svg.style.setProperty('--ico-stroke-width', `${(parseInt(value) || 10)}`);
                            break;
                    }
                    break;
                case 'icon':
                    if (!value) return;
                    let idata = value.split('|');
                    let icon = idata.shift();
                    idata.forEach(flag => {
                        let av = flag.split(':');
                        if (av[0].startsWith('-')) {
                            t.removeAttribute(av[0].substring(1));
                        } else {
                            t.setAttribute(av[0], webui.getDefined(av[1], true));
                        }
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
        connected: (t) => {
            if (!t.shape) {
                t._backPath.setAttribute('d', defSquare);
            }
        },
        setIconDefinition(iconDef) {
            if (!iconDef || typeof iconDef !== 'string') return;
            const t = this;
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
            const t = this;
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
                path.setAttribute('d', defUnused);
                return;
            }
            let segments = rule.split('|');
            path.classList.remove('tri');
            path.classList.remove('duo');
            if (segments.length > 1) {
                let seg = segments.shift();
                let num = parseInt(seg);
                if (isNaN(num)) {
                    switch (seg) {
                        case 'tri':
                        case 'trio':
                            path.classList.add('tri');
                            break;
                        case 'bi':
                        case 'duo':
                            path.classList.add('duo');
                            break;
                    }
                } else {
                    path.style.stroke = stroke;
                }
            }
            while (segments.length > 1) {
                segments.shift();
            }
            path.setAttribute('d', segments[0]);
        },
        clearPaths() {
            const t = this;
            for (let instance = 1; instance <= pathCount; ++instance) {
                let key = `_i${instance}`;
                t[key].setAttribute('d', defUnused);
            }
        },
        shadowTemplate: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200">
<!--! Stoic Dreams - https://webui.stoicdreams.com License - https://webui.stoicdreams.com/license Copyright 2024 Stoic Dreams Inc. -->
<defs>
<style></style>
</defs>
<path class="backing" d=""></path>
<path class="i1" d=""></path>
<path class="i2" d=""></path>
<path class="i3" d=""></path>
<path class="i4" d=""></path>
<path class="i5" d=""></path>
<path class="i6" d=""></path>
<path class="i7" d=""></path>
<path class="i8" d=""></path>
<path class="ban" d="M-60 60Q-50 50 -50 50Q-35 35 -35 35Q-20 20 -20 20Q-10 10 -10 10Q-5 5 -5 5Q5 -5 5 -5Q10 -10 10 -10Q20 -20 20 -20Q35 -35 35 -35Q50 -50 50 -50Q60 -60 60 -60z"></path>
</svg>
<slot name="count"></slot>
<style type="text/css">
:host {
--ico-color-border: var(--icon-default-border-color, transparent);
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
fill:transparent;
stroke:var(--ico-color-primary);
stroke-width:var(--ico-stroke-width);
stroke-linecap:round;
stroke-linejoin: round;
opacity:1;
}
path.tri,
path.tri {
stroke:var(--ico-color-tertiary);
}
path.duo,
path.duo {
stroke:var(--ico-color-secondary);
}
:host([fill]) path:not(.backing) {
--my-fill-color:var(--icon-color-primary);
fill:var(--my-fill-color);
}
:host([fill]) path,
:host([shade="duo"]) path {
--ico-color-secondary: color-mix(in srgb, var(--ico-color-primary) 50%, var(--ico-color-offset));
--ico-color-tertiary: color-mix(in srgb, var(--ico-color-primary) 50%, var(--ico-color-offset));
}
:host([shade="tri"]) path {
--ico-color-secondary: color-mix(in srgb, var(--ico-color-primary) 66%, var(--ico-color-offset));
--ico-color-tertiary: color-mix(in srgb, var(--ico-color-primary) 33%, var(--ico-color-offset));
}
:host([fill]) path:not(.backing).duo,
:host([fill]) path:not(.backing).tri,
:host([fill][shade="duo"]) path:not(.backing).duo {
--my-fill-color:var(--ico-color-secondary);
}
:host([fill][shade="tri"]) path:not(.backing).duo {
--my-fill-color:var(--ico-color-secondary);
}
:host([fill][shade="tri"]) path:not(.backing).tri {
--my-fill-color:var(--ico-color-tertiary);
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
:host([border]) path.backing,
:host([bordered]) path.backing {
--ico-color-border:var(--ico-color-primary);
}
:host(:not([circle]):not([inverted]):not([square]) path.backing),
path[d=""] {
display:none;
}
slot[name="count"] {
display:flex;
justify-content:center;
position:absolute;
border-radius:1em;
background-color:var(--theme-color-offset, var(--color-info-offset));
color:var(--theme-color, var(--color-info));
bottom:50%;
right:-5%;
padding:1px;
font-size:0.6em;
min-width:1rem;
text-align:center;
}
slot[name="count"]:empty {
display:none;
}
path[d="M0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0z"] {
stroke-width:0;
}
path.ban {
stroke-width:calc(var(--ico-stroke-width) * 2);
}
:host(:not([ban])) path.ban {
display:none;
}
</style>`
    });
}
/*
:host([fill]) path.tri,
:host([fill]) path.tri {
fill:var(--ico-color-tertiary);
}
:host([fill]) path.duo,
:host([fill]) path.duo,
:host([fill]) path.duo {
fill:var(--ico-color-secondary);
}
:host([fill]) path:not(.backing) {
fill:color-mix(in srgb, var(--ico-color-primary) 80%, var(--ico-color-offset));
}
:host([shade="duo"][fill]) path:not(.backing),
:host([shade="tri"][fill]) path:not(.backing) {
fill:color-mix(in srgb, var(--ico-color-primary) 90%, var(--ico-color-offset));
}
:host([shade="duo"][fill]) path:not(.backing).tri {
fill:var(--ico-color-tertiary);
}
:host([shade="duo"][fill]) path:not(.backing).duo {
fill:var(--ico-color-secondary);
}

:host([shade="tri"][fill]) path:not(.backing).tri {
fill:color-mix(in srgb, var(--ico-color-primary) 20%, var(--ico-color-offset));
}
:host([shade="tri"][fill]) path:not(.backing).duo {
fill:color-mix(in srgb, var(--ico-color-primary) 20%, var(--ico-color-offset));
}
*/