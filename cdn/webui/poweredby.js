/*!
 * Web UI Powered By - https://webui.stoicdreams.com/components#webui-poweredby
 * A component for displaying the "Powered By" information within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
webui.define('webui-poweredby', {
    constructor: (t) => {
        t.anchor = webui.create('a');
        t.anchor.setAttribute('href', 'https://webui.stoicdreams.com');
        t.anchor.innerHTML = 'Web UI';
        t.appendChild(t.anchor);
    },
    attr: ['version'],
    attrChanged: (t, property, value) => {
        switch (property) {
            case 'version':
                t.anchor.setAttribute('title', `Web UI version ${value}`);
                break;
        }
    },
    connected: (t) => {
        if (!t.version) {
            t.setAttribute("version", "0.11.41");
            webui.setData('webui-version', t.getAttribute('version'));
        }
    },
    shadowTemplate: `
<style type="text/css">
:host {
white-space:nowrap;
}
a[href] {
color:inherit;
}
</style>
<div>
<sup>Powered by </sup>
<slot></slot>
</div>
`
});
