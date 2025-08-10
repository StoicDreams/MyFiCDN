/*!
 * Web UI Font Awesome - https://webui.stoicdreams.com/components#fa
 * A component for displaying and managing Font Awesome icons within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    const faCache = {
        'regular': {}
    };
    const faWait = {
        'regular': {}
    };
    async function getIcon(family, name, handler) {
        if (!name || !family) {
            return '';
        }
        if (!faCache[family]) {
            faCache[family] = {};
            faWait[family] = {};
        }
        let svg = faCache[family][name];
        if (svg) {
            handler(svg);
            return;
        }
        if (faWait[family][name]) {
            faWait[family][name].push(handler);
        } else {
            faWait[family][name] = [];
            try {
                // TODO: implement loading from Font Awesome Kits through API
                svg = '';
            } catch (ex) {
                console.error('Failed loading fa icon file', family, name, ex);
                svg = '';
            }
            faCache[family][name] = svg;
            handler(svg);
            setTimeout(() => {
                faWait[family][name].forEach(h => h(svg));
            }, 10);
        }
    }
    webui.define("webui-fa", {
        constructor: (t) => {
            t.loadid = 0;
            t.svg = webui.create('svg');
            t.icon = "triangle-exclamation";
            t.iconSlot = t.template.querySelector('slot[name=icon]');
            t.countSlot = t.template.querySelector('slot[name=count]');
        },
        attr: ['icon', 'family', 'class', 'count'],
        attrChanged: (t, property, value) => {
            if (property === 'icon' || property === 'family') {
                let loadid = t.loadid + 1;
                t.loadid = loadid;
                setTimeout(() => {
                    if (t.loadid !== loadid) return;
                    t.updateIcon();
                }, 1);
                return;
            }
            switch (property) {
                case 'count':
                    let num = parseInt(value) || 0;
                    if (num > 0) {
                        t.countSlot.innerHTML = num.toLocaleString();
                    } else {
                        t.countSlot.innerHTML = value;
                    }
                    break;
            }
        },
        updateIcon: async function () {
            const t = this;
            let name = t.icon;
            let family = t.family;
            if (!family) {
                family = window.getComputedStyle(t).getPropertyValue('--fa-default-family');
            }
            if (!family) {
                family = 'regular';
            }
            getIcon(family, name, svg => {
                t.svg = svg;
                t.iconSlot.innerHTML = `${t.svg}`;
            });
        },
        shadowTemplate: `
<style type="text/css">
:host {
display: inline-flex;
position: relative;
align-items: center;
justify-items: center;
}
svg {
height: 2ch;
width: 3ch;
fill: currentColor;
line-height: 2ch;
vertical-align: middle;
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
</style>
<slot name="icon"></slot>
<slot name="count"></slot>
`
    });
}
