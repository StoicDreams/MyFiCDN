/* Link Component */
"use strict"
webui.define('webui-link', {
    constructor: (t) => {
        t._startIcon = t.template.querySelector('slot[name="start-icon"]');
        t._endIcon = t.template.querySelector('slot[name="end-icon"]');
    },
    attr: ['href', 'start-icon', 'end-icon', 'start-icon-family', 'end-icon-family'],
    attrChanged: (t, property, value) => {
        switch (property) {
            case 'startIcon':
                {
                    t.querySelectorAll('[slot="start-icon"]').forEach(n => n.remove());
                    if (!t.startIcon) break;
                    let ico = document.createElement('webui-icon');
                    ico.setAttribute('slot', 'start-icon');
                    ico.setAttribute('icon', t.startIcon);
                    t.appendChild(ico);
                }
                break;
            case 'endIcon':
                {
                    t.querySelectorAll('[slot="end-icon"]').forEach(n => n.remove());
                    if (!t.endIcon) break;
                    let ico = document.createElement('webui-icon');
                    ico.setAttribute('slot', 'end-icon');
                    ico.setAttribute('icon', t.endIcon);
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
color:var(--theme-color, inherit);
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
