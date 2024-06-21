/* Button Component */
"use strict"
webui.define("webui-button", {
    constructor: (t) => {
        t._startIcon = t.template.querySelector('slot[name="start-icon"]');
        t._endIcon = t.template.querySelector('slot[name="end-icon"]');
    },
    attr: ['href', 'theme', 'start-icon', 'end-icon', 'start-icon-family', 'end-icon-family', 'start-icon-class', 'end-icon-class', 'elevation'],
    attrChanged: (t, property, value) => {
        switch (property) {
            case 'theme':
                t.setTheme(value);
                break;
            case 'start-icon-family':
            case 'start-icon-class':
            case 'start-icon':
                {
                    t.querySelectorAll('[slot="start-icon"]').forEach(n => n.remove());
                    if (!t['start-icon']) break;
                    let ico = document.createElement('webui-fa');
                    ico.setAttribute('slot', 'start-icon');
                    ico.setAttribute('icon', t['start-icon']);
                    if (t['start-icon-family']) {
                        ico.setAttribute('family', t['start-icon-family']);
                    }
                    if (t['start-icon-class']) {
                        ico.className = t['start-icon-class'];
                    }
                    t.appendChild(ico);
                }
                break;
            case 'end-icon-family':
            case 'end-icon-class':
            case 'end-icon':
                {
                    t.querySelectorAll('[slot="end-icon"]').forEach(n => n.remove());
                    if (!t['end-icon']) break;
                    let ico = document.createElement('webui-fa');
                    ico.setAttribute('slot', 'end-icon');
                    ico.setAttribute('icon', t['end-icon']);
                    if (t['end-icon-family']) {
                        ico.setAttribute('family', t['end-icon-family']);
                    }
                    if (t['end-icon-class']) {
                        ico.className = t['end-icon-class'];
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
min-height: 2em;
-webkit-user-select: text;
user-select: text;
background-color: var(--color-button);
color: var(--color-button-offset);
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
