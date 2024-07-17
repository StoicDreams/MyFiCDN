/* Button Component */
"use strict"
webui.define("webui-button", {
    constructor: (t) => {
        t._startIcon = t.template.querySelector('slot[name="start-icon"]');
        t._endIcon = t.template.querySelector('slot[name="end-icon"]');
    },
    attr: ['href', 'start-icon', 'end-icon', 'start-icon-family', 'end-icon-family', 'start-icon-class', 'end-icon-class', 'elevation'],
    attrChanged: (t, property, _value) => {
        switch (property) {
            case 'startIconFamily':
            case 'startIconClass':
            case 'startIcon':
                {
                    t.querySelectorAll('[slot="start-icon"]').forEach(n => n.remove());
                    if (!t.startIcon) break;
                    let ico = document.createElement('webui-fa');
                    ico.setAttribute('slot', 'start-icon');
                    ico.setAttribute('icon', t.startIcon);
                    if (t.startIconFamily) {
                        ico.setAttribute('family', t.startIconFamily);
                    }
                    if (t.startIconClass) {
                        ico.className = t.startIconClass;
                    }
                    t.appendChild(ico);
                }
                break;
            case 'endIconFamily':
            case 'endIconClass':
            case 'endIcon':
                {
                    t.querySelectorAll('[slot="end-icon"]').forEach(n => n.remove());
                    if (!t.endIcon) break;
                    let ico = document.createElement('webui-fa');
                    ico.setAttribute('slot', 'end-icon');
                    ico.setAttribute('icon', t.endIcon);
                    if (t.endIconFamily) {
                        ico.setAttribute('family', t.endIconFamily);
                    }
                    if (t.endIconClass) {
                        ico.className = t.endIconClass;
                    }
                    t.appendChild(ico);
                }
                break;

        }
    },
    shadowTemplate: `
<style type="text/css">
:host {
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
}
:host([disabled]) {
pointer-events:none;
}
:host(:not([disabled])) {
cursor:pointer;
}
</style>
<slot name="start-icon"></slot>
<slot></slot>
<slot name="end-icon"></slot>
`
});
