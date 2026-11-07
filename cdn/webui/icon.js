/*!
 * Web UI Icon - https://webui.stoicdreams.com/components#webui-icon
 * A component for displaying and managing icons within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
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
    const pathCount = 10;
    const cache = {};
    const defUnused = 'M0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0Q0 0 0 0z';
    const defShield = 'M-90 -25Q-90 -75 -90 -75Q-40 -75 0 -90Q50 -75 90 -75Q90 -30 90 -30Q90 -20 90 -20Q90 0 90 0Q90 25 60 50Q0 90 0 90Q-60 50 -60 50Q-90 25 -90 0Q-90 -15 -90 -15z';
    const defBadge = 'M-28 68Q0 115 28 68Q86 86 68 28Q115 0 68 -28Q86 -86 28 -68Q1 -115 -28 -68Q-86 -86 -68 -28Q-115 0 -68 28Q-86 86 -28 68Q-28 68 -28 68Q-28 68 -28 68Q-28 68 -28 68z';
    const defCircle = 'M1 -93Q31 -91 53 -76Q76 -59 86 -35Q95 -12 92 13Q89 37 72 59Q58 76 37 86Q10 97 -16 92Q-45 85 -64 68Q-85 47 -92 16Q-96 -10 -87 -34Q-76 -60 -56 -75Q-26 -94 1 -93z';
    const defCloud = 'M0 -90Q50 -90 55 -50Q80 -45 75 -15Q90 -10 90 20Q90 60 55 60Q40 60 40 60Q35 80 10 85Q-30 85 -40 60Q-85 55 -90 15Q-90 10 -90 5Q-85 -35 -55 -40Q-55 -90 0 -90z';
    const defSquare = 'M0 -95Q80 -95 80 -95Q95 -95 95 -80Q95 0 95 0Q95 80 95 80Q95 95 80 95Q0 95 0 95Q-80 95 -80 95Q-95 95 -95 80Q-95 0 -95 0Q-95 -80 -95 -80Q-95 -95 -80 -95z';
    const defTriangle = 'M0 -90Q20 -55 20 -55Q40 -20 40 -20Q55 5 55 5Q90 65 90 65Q60 65 60 65Q0 65 0 65Q-55 65 -55 65Q-90 65 -90 65Q-55 5 -55 5Q-40 -20 -40 -20Q-20 -55 -20 -55z';
    const defTallTriangle = 'M0 -90Q25 -40 25 -40Q40 -10 40 -10Q55 20 55 20Q90 90 90 90Q60 90 60 90Q0 90 0 90Q-55 90 -55 90Q-90 90 -90 90Q-50 10 -50 10Q-30 -30 -30 -30Q-15 -60 -15 -60z';
    const defOcto = `M0 -90Q40 -90 40 -90Q90 -40 90 -40Q90 0 90 0Q90 40 90 40Q40 90 40 90Q0 90 0 90Q-40 90 -40 90Q-90 40 -90 40Q-90 0 -90 0Q-90 -40 -90 -40Q-40 -90 -40 -90z`;
    const missing = {};
    function noteMissingIcon(name, ex) {
        if (missing[name]) return;
        missing[name] = true;
        console.warn('missing icon', name, ex || '');
    }
    function loadIcon(name) {
        if (!cache[name]) {
            const srcRoot = webui.getData('appName') === 'My Fidelity CDN' ? '/icons/' : 'https://cdn.myfi.ws/icons/';
            cache[name] = webui.fetchWithCache(`${srcRoot}${name}.webui`)
                .then(iconDef => {
                    if (iconDef.startsWith("WEBUI-ICON-")) {
                        return iconDef.replace(/\r/g, '');
                    }
                    noteMissingIcon(name);
                    return notFoundDef;
                })
                .catch(ex => {
                    noteMissingIcon(name, ex);
                    return notFoundDef;
                });
        }
        return cache[name];
    }
    webui.define('webui-icon', {
        constructor() {
            const t = this;
            t._svg = t.template.querySelector('svg.main');
            t._countSlot = t.template.querySelector('slot[name=count]');
            t._style = t.template.querySelector('defs style');
            t._backPath = t.template.querySelector('path.backing');
            t._dynPaths = [];
            for (let instance = 1; instance <= pathCount; ++instance) {
                t[`_i${instance}`] = t.template.querySelector(`path.i${instance}`);
                t._dynPaths.push(t[`_i${instance}`]);
            }
        },
        attr: ['width', 'height', 'shadow', 'icon', 'inverted', 'backing', 'shape', 'rotate', 'flip', 'count', 'stroke', 'shade'],
        attrChanged(property, value) {
            const t = this;
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
                case 'flip':
                    t.applyTransform();
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
                        case 'cloud':
                            t._backPath.setAttribute('d', defCloud);
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
                        t._svg.style.removeProperty('--ico-stroke-width');
                        break;
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
                    // Flags the last piped value added are removed when this one leaves them out, so icon="bell|fill"
                    // followed by icon="bell" is no longer filled. Attributes set directly on the element are kept.
                    const piped = new Set();
                    idata.forEach(flag => {
                        let av = flag.split(':');
                        if (av[0].startsWith('-')) {
                            t.removeAttribute(av[0].substring(1));
                        } else {
                            if (!t.hasAttribute(av[0]) || t._pipedFlags?.has(av[0])) piped.add(av[0]);
                            t.setAttribute(av[0], webui.getDefined(av[1], true));
                        }
                    });
                    t._pipedFlags?.forEach(name => {
                        if (!piped.has(name)) t.removeAttribute(name);
                    });
                    t._pipedFlags = piped;
                    if (icon.startsWith('emoji-')) {
                        t.setEmoji(icon);
                        return;
                    }
                    t._iconRequest = icon;
                    loadIcon(icon).then(iconDef => {
                        // Icons load at different speeds, so only the latest request may apply.
                        if (t._iconRequest === icon) {
                            t.setIconDefinition(iconDef);
                        }
                    });
                    break;
                case 'shadow':
                    t._svg.style.filter = value ? `drop-shadow(${value})` : '';
                    break;
                case 'width':
                    t.style.width = webui.pxIfNumber(value);
                    break;
                case 'height':
                    t.style.height = webui.pxIfNumber(value);
                    break;
            }
        },
        connected() {
            const t = this;
            if (!t.shape) {
                t._backPath.setAttribute('d', defSquare);
            }
            // An icon with a title or label is an image with that name. Any other icon is decoration beside text,
            // so screen readers skip it rather than reading out an emoji or an unnamed image.
            const name = t.getAttribute('aria-label') || t.getAttribute('title');
            if (name) {
                if (!t.hasAttribute('role')) t.setAttribute('role', 'img');
                if (!t.hasAttribute('aria-label')) t.setAttribute('aria-label', name);
            } else if (!t.hasAttribute('aria-hidden')) {
                t.setAttribute('aria-hidden', 'true');
            }
        },
        /**
         * Turn and mirror the icon, from the rotate attribute (degrees) and the flip attribute: x mirrors left to
         * right, y top to bottom, and both does both. So one icon covers every direction, such as arrow|rotate:90
         * for a down arrow, or undo|flip for redo.
         */
        applyTransform() {
            const t = this;
            const number = parseFloat(t.getAttribute('rotate'));
            const flip = t.getAttribute('flip');
            const parts = [];
            if (number > 0 || number < 0) parts.push(`rotate(${number}deg)`);
            switch (flip === null ? null : flip.toLowerCase()) {
                case null:
                case 'false':
                case 'none':
                    break;
                case 'y':
                case 'vertical':
                    parts.push('scale(1, -1)');
                    break;
                case 'both':
                case 'xy':
                    parts.push('scale(-1, -1)');
                    break;
                default:
                    parts.push('scale(-1, 1)');
                    break;
            }
            const style = parts.join(' ');
            t._rotation = style;
            if (t._emoji) {
                t._emoji.style.transform = style;
            }
            t._dynPaths.forEach(p => {
                p.style.transform = style;
            });
        },
        /** Show another icon, with the same piped format as the icon attribute. Use with data-subscribe="key:setIcon". */
        setIcon(value) {
            if (value) this.setAttribute('icon', value);
        },
        setEmoji(emoji) {
            const t = this;
            const emojiChar = emoji.replace('emoji-', '');
            t._iconRequest = emoji;
            t._svg.classList.add('emoji');
            if (!t._emoji) {
                // Most icons never show an emoji, so this component and its data are only loaded when one does.
                t._emoji = webui.create('webui-emoji');
                t._emoji.style.transform = t._rotation || '';
                t._svg.after(t._emoji);
            }
            t._emoji.setAttribute('emoji', emojiChar);
        },
        setIconDefinition(iconDef) {
            const t = this;
            t._emoji?.removeAttribute('emoji');
            if (!iconDef || typeof iconDef !== 'string') return;
            t._svg.classList.remove('emoji');
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
        /**
         * Draw one line of an icon definition. A line can start with a shade (bi, duo, tri, or trio) and a stroke
         * width, in either order, such as "bi|20|M0 0Q...". Anything not given is reset, so an icon that morphs
         * from another does not keep its shade or width.
         */
        setPathRule(path, rule) {
            const segments = (rule || '').split('|');
            const d = segments.pop();
            let shade = '', width = '';
            segments.forEach(seg => {
                switch (seg.trim()) {
                    case 'tri':
                    case 'trio':
                        shade = 'tri';
                        break;
                    case 'bi':
                    case 'duo':
                        shade = 'duo';
                        break;
                    default:
                        if (!isNaN(parseInt(seg))) width = `${parseInt(seg)}`;
                        break;
                }
            });
            path.classList.toggle('tri', shade === 'tri');
            path.classList.toggle('duo', shade === 'duo');
            if (width) {
                // Keep the width when the icon shrinks inside a shape, the same as the icon's own stroke.
                path.style.strokeWidth = `calc(${width} / var(--ico-glyph-scale))`;
            } else {
                path.style.removeProperty('stroke-width');
            }
            path.setAttribute('d', d || defUnused);
        },
        clearPaths() {
            const t = this;
            for (let instance = 1; instance <= pathCount; ++instance) {
                let key = `_i${instance}`;
                t[key].setAttribute('d', defUnused);
            }
        },
        shadowTemplate: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200" class="main">
<!--! Stoic Dreams - https://webui.stoicdreams.com License - https://webui.stoicdreams.com/license Copyright 2024 Stoic Dreams Inc. -->
<defs>
<style></style>
</defs>
<path class="backing" d=""></path>
<g class="glyph">
<path class="i1" d=""></path>
<path class="i2" d=""></path>
<path class="i3" d=""></path>
<path class="i4" d=""></path>
<path class="i5" d=""></path>
<path class="i6" d=""></path>
<path class="i7" d=""></path>
<path class="i8" d=""></path>
<path class="i9" d=""></path>
<path class="i10" d=""></path>
</g>
</svg>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200" class="overlay">
<!--! Stoic Dreams - https://webui.stoicdreams.com License - https://webui.stoicdreams.com/license Copyright 2024 Stoic Dreams Inc. -->
<path class="ban-gap" d="M-60 60Q-50 50 -50 50Q-35 35 -35 35Q-20 20 -20 20Q-10 10 -10 10Q-5 5 -5 5Q5 -5 5 -5Q10 -10 10 -10Q20 -20 20 -20Q35 -35 35 -35Q50 -50 50 -50Q60 -60 60 -60z"></path>
<path class="ban" d="M-60 60Q-50 50 -50 50Q-35 35 -35 35Q-20 20 -20 20Q-10 10 -10 10Q-5 5 -5 5Q5 -5 5 -5Q10 -10 10 -10Q20 -20 20 -20Q35 -35 35 -35Q50 -50 50 -50Q60 -60 60 -60z"></path>
</svg>
<slot name="count"></slot>
<style type="text/css">
:host {
--ico-glyph-scale: 1;
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
justify-content: center;
height: 1ch;
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
/* Inside a drawn shape the icon shrinks, so it sits within the shape the way circled and boxed icons do. */
:host([backing]),
:host([bordered]),
:host([border]),
:host([inverted]) {
--ico-glyph-scale: var(--icon-glyph-scale, 0.62);
}
g.glyph {
transform: scale(var(--ico-glyph-scale));
transition: transform var(--ico-transition-duration) ease-in-out;
}
path {
transition: all var(--ico-transition-duration) ease-in-out;
fill:transparent;
stroke:var(--ico-color-primary);
/* Divided by the scale, so a shrunken icon keeps the same line weight. */
stroke-width:calc(var(--ico-stroke-width) / var(--ico-glyph-scale));
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
--my-fill-color:var(--ico-color-primary);
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
/* The backing only shows when it is filled or bordered. */
:host(:not([backing]):not([inverted]):not([border]):not([bordered])) path.backing,
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
stroke-width:calc(var(--ico-stroke-width) * 1.5);
}
/* A gap in the background color either side of the slash, so it reads as crossing the icon out. */
path.ban-gap {
stroke:var(--ico-color-offset, transparent);
stroke-width:calc(var(--ico-stroke-width) * 3.5);
}
webui-emoji {
display:flex;
position:absolute;
top:0;
left:0;
width:100%;
height:100%;
justify-content:center;
align-items:center;
}
:host(:not([ban])) path.ban,
:host(:not([ban])) path.ban-gap,
svg.main:not(.emoji) webui-emoji,
svg.main.emoji path:not(.backing) {
display:none;
}
svg.overlay {
display:block;
position:absolute;
top:0;
left:0;
}
</style>`
    });
}
