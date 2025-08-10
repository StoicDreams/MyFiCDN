/*!
 * Web UI Alert - https://webui.stoicdreams.com/components#alert
 * Display inline alert message.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
webui.define("webui-alert", {
    preload: 'icon',
    constructor: (t) => {
        t.icon = t.template.querySelector('#icon');
        t.btnClose = t.template.querySelector('#close');
        t.btnClose.addEventListener('click', _ev => {
            t.userclosed = true;
            t.removeAttribute('show');
        });
    },
    attr: ['variant', 'show'],
    attrChanged: (t, property, value) => {
        switch (property) {
            case 'theme':
            case 'variant':
                t.setVariant(value);
                break;
        }
    },
    connected: (t) => {
        if (!t.variant) {
            t.setVariant('warning');
        }
        if (t.innerHTML === '') {
            t.removeAttribute('show');
        }
    },
    setValue: function (options, variant) {
        const t = this;
        if (typeof options === 'string') {
            try {
                options = JSON.parse(options);
            } catch {
                options = { text: options };
            }
        }
        if (!options) {
            t.removeAttribute('show');
            return;
        }
        if (variant) {
            options.variant = variant;
        }
        if (options.theme) {
            t.setVariant(options.theme);
        } else if (options.variant) {
            t.setVariant(options.variant);
        }
        if (options.text) {
            t.innerText = options.text;
        } else if (options.html) {
            t.innerHTML = options.html;
        }
        t.setAttribute('show', true);
    },
    setVariant: function (theme) {
        this.setTheme(theme);
        switch (theme) {
            case "danger":
                this.icon.setAttribute('icon', 'exclamation');
                this.icon.setAttribute('shape', 'octogon');
                break;
            case "success":
                this.icon.setAttribute('icon', 'thumbs-up|has-shadow:true|fill|shade:tri');
                this.icon.setAttribute('shape', 'circle');
                break;
            case "info":
                this.icon.setAttribute('icon', 'exclamation');
                this.icon.setAttribute('shape', 'circle');
                break;
            default:
                this.icon.setAttribute('icon', 'exclamation');
                this.icon.setAttribute('shape', 'triangle');
                break;
        }
    },
    shadowTemplate: `
<webui-icon id="icon" icon="" bordered backing></webui-icon>
<div><slot></slot></div>
<button id="close"><webui-icon icon="xmark"></webui-icon></button>
<style type="text/css">
:host {
display:none;
flex-direction:row;
gap:var(--padding);
padding:var(--padding, 1em);
align-items:center;
justify-content:start;
opacity:0;
transform:scaleY(0);
transition:all 0.4s ease-out allow-discrete;
background-color:var(--theme-color, inherit);
color:var(--theme-color-offset, inherit);
--icon-height:2.5ch;
}
:host>div {
flex-grow:1;
}
:host([show]) {
display:flex;
opacity:1;
transform:scaleY(1);
}
@starting-style {
:host([show]) {
opacity:0;
transform:scaleY(0);
}
}
button {
display:inline-flex;
cursor:pointer;
padding:auto 0em;
align-items:center;
justify-content:center;
border:none;
background:none;
color:inherit;
border-radius:var(--corners);
}
</style>
`
});
