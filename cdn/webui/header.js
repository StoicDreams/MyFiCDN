"use strict"
{
    webui.define('webui-header', {
        preload: "",
        constructor: (t) => {
            t._slot = t.template.querySelector('slot:not([name])');
            t._slotTemplate = t.template.querySelector('slot[name="template"]');
        },
        attr: [],
        attrChanged: (t, property, value) => {

        },
        connected: (t) => {
            t.template = '';
            t._slotTemplate.assignedElements().forEach(node => {
                if (node.nodeName === 'PRE') {
                    t.template = `${t.template}${node.innerHTML}`;
                }
            });
            if (t.dataset.subscribe) {
                return;
            }
            let value = t._slot.innerHTML;
            if (value.trim() && t.template) {
                t.setValue({ html: value });
            }
        },
        setValue: function (value, key) {
            let t = this;
            if (t.template) {
                switch (typeof value) {
                    case 'number':
                    case 'string':
                        let data = {};
                        data[key] = value;
                        value = data;
                        break;
                }
                t.innerHTML = webui.replaceAppData(t.template, value);
            } else {
                t.innerHTML = value;
            }
        },
        shadowTemplate: `
<slot></slot>
<slot name="template"></slot>
<style type="text/css">
:host {
display:block;
width:100%;
width:-webkit-fill-available;
box-sizing:border-box;
background-color:var(--theme-color);
color:var(--theme-color-offset);
font-size: calc(var(--typography-size) * 1.75);
margin: 0;
padding: var(--padding);
border-radius: var(--corners) var(--corners) 0 0;
}
slot[name="template"] {display:none;}
</style>`
    });
}
