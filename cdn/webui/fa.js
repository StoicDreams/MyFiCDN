/* Dynamically load font-awesome svg icons as requested */
"use strict"
{
    const faCache = {
        'regular': {
            'triangle-exclamation': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Pro 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2024 Fonticons, Inc.--><path d="M27.4 432L0 480H55.3 456.7 512l-27.4-48L283.6 80.4 256 32 228.4 80.4 27.4 432zm401.9 0H82.7L256 128.7 429.3 432zM232 296v24h48V296 208H232v88zm48 104V352H232v48h48z"/></svg>`
        }
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
                let result = await fetch(`https://cdn.myfi.ws/fa/svgs/${family}/${name}.svg`);
                if (!result.ok) return;
                svg = await result.text();
                if (!svg.startsWith("<svg")) {
                    svg = '';
                }
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
            t.svg = document.createElement('svg');
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
                    t.countSlot.innerHTML = `${value}`;
                    break;
            }
        },
        updateIcon: async function () {
            let t = this;
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
display:block;
position:absolute;
border-radius:1em;
background-color:var(--color-info);
color:var(--color-info-offset);
bottom:50%;
left:50%;
padding:1px;
font-size:0.6em;
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
