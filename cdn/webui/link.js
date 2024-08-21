/* Link Component */
"use strict"
webui.define('webui-link', {
    constructor: (t) => {
        t._startIcon = t.template.querySelector('slot[name="start-icon"]');
        t._endIcon = t.template.querySelector('slot[name="end-icon"]');
    },
    attr: ['href', 'icon', 'start-icon', 'end-icon'],
    attrChanged: (t, property, value) => {
        switch (property) {
            case 'icon':
            case 'startIcon':
                {
                    t.querySelectorAll('[slot="start-icon"]').forEach(n => n.remove());
                    if (!value) break;
                    let ico = document.createElement('webui-icon');
                    ico.setAttribute('slot', 'start-icon');
                    ico.setAttribute('icon', value);
                    t.appendChild(ico);
                }
                break;
            case 'endIcon':
                {
                    t.querySelectorAll('[slot="end-icon"]').forEach(n => n.remove());
                    if (!value) break;
                    let ico = document.createElement('webui-icon');
                    ico.setAttribute('slot', 'end-icon');
                    ico.setAttribute('icon', value);
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
text-decoration: underline;
padding: 0;
border:none;
outline:none;
font-size:inherit;
font:inherit;
-webkit-user-select: text;
user-select: text;
color:var(--theme-color-offset, inherit);
}
:host([href]:not(:disabled)),
:host([data-trigger]:not(:disabled)),
:host([onclick]:not(:disabled)) {
cursor:pointer;
}
</style>
<slot name="start-icon"></slot>
<slot></slot>
<slot name="end-icon"></slot>
`
});
