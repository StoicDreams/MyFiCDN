/*!
 * Web UI Line - https://webui.stoicdreams.com/components#webui-line
 * A component for displaying a horizontal line within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    webui.define("webui-line", {
        linkCss: false,
        watchVisibility: false,
        isInput: false,
        preload: '',
        constructor: (t) => {
        },
        flags: [],
        attr: ['size'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'size':
                    t.style.setProperty('--line-size', webui.pxIfNumber(value));
                    break;
            }
        },
        connected: function (t) { },
        disconnected: function (t) { },
        shadowTemplate: `
<style type="text/css">
:host {
padding:var(--padding);
--line-size:calc(0.5 * var(--padding));
--line-color:var(--theme-color-offset, --color-title);
}
:host([theme]) {
--line-color:var(--theme-color, --color-title);
}
div {
display:block;
background-color:var(--line-color);
padding:calc(0.5 * var(--line-size));
}
slot {
display:none;
}
</style>
<div></div>
<slot></slot>
`
    });
}
