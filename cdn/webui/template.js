/* Template for open web components. */
"use strict"
webui.define("webui-template", {
    constructor: (t) => { },
    attr: ['example'],
    attrChanged: (t, property, value) => {
        switch (property) {
            case 'example':
                break;
        }
    },
    connectedCallback: function () { },
    disconnectedCallback: function () { }
});

/* Template for open web components. */
"use strict"
webui.define("webui-shadow-template", {
    constructor: (t) => { },
    attr: ['example'],
    attrChanged: (t, property, value) => {
        switch (property) {
            case 'example':
                break;
        }
    },
    connectedCallback: function () { },
    disconnectedCallback: function () { },
    shadowTemplate: `
<style type="text/css">
:host {
}
</style>
<slot></slot>
<slot name="something"></slot>
`
});
