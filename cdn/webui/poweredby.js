/* Display multi-line, auto-resizing text input field. */
"use strict"
webui.define('webui-poweredby', {
    constructor: (t) => {
        t.anchor = document.createElement('a');
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
            t.setAttribute("version", "0.10.5");
        }
    },
    shadowTemplate: `
<style type="text/css">
:host {
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
