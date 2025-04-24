/* Button Component */
"use strict"
webui.define("webui-button", {
    constructor: (t) => {
        t._label = t.template.querySelector('slot:not([name])');
        t._startIcon = t.template.querySelector('slot[name="start-icon"]');
        t._endIcon = t.template.querySelector('slot[name="end-icon"]');
        t.addEventListener('click', _ => {
            if (t.dataset.transfer) {
                t.dataset.transfer.split('|').forEach(ft => {
                    let fts = t.dataset.transfer.split(':');
                    let data = webui.getData(fts[0]);
                    if (fts.length === 2) {
                        webui.setData(fts[1], data);
                        return;
                    }
                    webui.setData(fts[0], t.dataset.value);
                });
            }
            if (t.dataset.clear) {
                t.dataset.clear.split('|').forEach(tc => {
                    webui.setData(tc, undefined);
                });
            }
            if (t.dataset.removeItem) {
                let ds = t.dataset.removeItem.split(':');
                if (ds.length === 2) {
                    let data = webui.getData(ds[0]);
                    if (typeof data.splice === 'function') {
                        data.splice(ds[1], 1);
                    } else if (data[ds[1]] !== undefined) {
                        delete data[ds[1]];
                    }
                    webui.setData(ds[0], data);
                }
            }
        });
    },
    attr: ['label', 'href', 'start-icon', 'end-icon', 'start-icon-family', 'end-icon-family', 'start-icon-class', 'end-icon-class', 'elevation'],
    attrChanged: (t, property, value) => {
        switch (property) {
            case 'label':
                t.childNodes.forEach(node=>{
                    if (node.nodeName === '#text' || (node.hasAttribute && !node.hasAttribute('slot'))) {
                        node.remove();
                    }
                });
                t.appendChild(webui.create('span', {html:value}));
                break;
            case 'startIconClass':
            case 'startIcon':
                {
                    t.querySelectorAll('[slot="start-icon"]').forEach(n => n.remove());
                    if (!t.startIcon) break;
                    let ico = webui.create('webui-icon');
                    ico.setAttribute('slot', 'start-icon');
                    ico.setAttribute('icon', t.startIcon);
                    if (t.startIconClass) {
                        ico.className = t.startIconClass;
                    }
                    t.appendChild(ico);
                }
                break;
            case 'endIconClass':
            case 'endIcon':
                {
                    t.querySelectorAll('[slot="end-icon"]').forEach(n => n.remove());
                    if (!t.endIcon) break;
                    let ico = webui.create('webui-icon');
                    ico.setAttribute('slot', 'end-icon');
                    ico.setAttribute('icon', t.endIcon);
                    if (t.endIconClass) {
                        ico.className = t.endIconClass;
                    }
                    t.appendChild(ico);
                }
                break;
        }
    },
    shadowTemplate: `
<slot name="start-icon"></slot>
<slot></slot>
<slot name="end-icon"></slot>
<style type="text/css">
:host {
--theme-shadow-blur:var(--box-shadow-blur, 2px);
display: inline-flex;
flex-flow: row;
gap: 0.5em;
align-items: center;
text-decoration: none;
padding: calc(1 * var(--padding)) calc(2 * var(--padding));
border-radius: var(--corners);
min-height: 1em;
-webkit-user-select: text;
user-select: text;
background-color: color-mix(in srgb, var(--theme-color) 90%, black);
color: var(--theme-color-offset);
-webkit-user-select: none;
-ms-user-select: none;
user-select: none;
box-shadow:inset 1px 1px var(--theme-shadow-blur) rgba(255,255,255,0.5), inset -1px -1px var(--theme-shadow-blur) rgba(0,0,0,0.5), 1px 1px var(--theme-shadow-blur) rgba(0,0,0,0.5);
white-space:nowrap;
}
:host([wrap]) {
white-space:wrap;
}
:host([disabled]) {
pointer-events:none;
background-color: color-mix(in srgb, var(--theme-color) 50%, #888888);
color: color-mix(in srgb, var(--theme-color-offset) 50%, #888888);
box-shadow:inset -1px -1px var(--box-shadow-blur) rgba(255,255,255,0.5), inset 1px 1px var(--box-shadow-blur) rgba(0,0,0,0.5);
}
:host(:not([disabled])) {
cursor:pointer;
}
</style>
`
});
