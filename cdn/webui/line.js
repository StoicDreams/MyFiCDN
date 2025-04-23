
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
                    t.style.setProperty('--line-size',webui.pxIfNumber(value));
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
--line-color:var(--color-title);
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
