/*!
 * Web UI Quote - https://webui.stoicdreams.com/components#webui-quote
 * A component for displaying and managing quotes within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
webui.define("webui-quote", {
    constructor() {
        const t = this;
        t._cite = t.template.querySelector('cite');
    },
    attr: ['cite', 'elevation', 'theme'],
    connected() {
        const t = this;
        if (t.cite) {
            t._cite.innerHTML = t.cite;
        }
    },
    shadowTemplate: `
<slot></slot>
<cite></cite>
<style type="text/css">
:host {
display: block;
margin: var(--padding);
padding: var(--padding);
border-left: calc(2 * var(--padding)) solid var(--theme-color);
box-shadow: var(--elevation-10);
box-sizing: border-box;
}
cite {
margin: 0 0 0 auto;
display: block;
width: max-content;
}
cite:before {
content: "— ";
color: var(--theme-color);
}
cite:empty {display:none;}
</style>`
});
