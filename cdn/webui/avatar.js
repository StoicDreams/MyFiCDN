/*!
 * Web UI Avatar - https://webui.stoicdreams.com/components#avatar
 * A component for displaying user avatars.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
webui.define("webui-avatar", {
    constructor: (t) => {
        t._slot = t.template.querySelector('slot');
    },
    attr: ['src'],
    attrChanged: (t, property, value) => {
        switch (property) {
            case 'src':
                if (!value) {
                    t._slot.innerHTML = '';
                    return;
                }
                if (value.startsWith('<svg')) {
                    t._slot.innerHTML = value;
                    return;
                }
                if (value.indexOf('/') === -1) {
                    t._slot.innerHTML = `<webui-icon icon="${value}""></webui-icon>`;
                    return;
                }
                if (value.length < 3) {
                    t._slot.innerHTML = value;
                    return;
                }
                t._slot.innerHTML = `<img src="${value}" />`;
                break;
        }
    },
    shadowTemplate: `
<style type="text/css">
:host {
display:inline-flex;
justify-content:center;
align-items:center;
margin:auto;
background-color:var(--theme-color);
color:var(--theme-color-offset);
}
slot {
font-size: 1.2em;
}
slot>img,
slot>svg {
height:1em;
}
</style>
<slot></slot>
`
});
