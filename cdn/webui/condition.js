"use strict"
{
    webui.define("webui-condition", {
        constructor: (t) => {
            t._data = {};
            t._slotValid = t.template.querySelector('slot[name="valid"]');
            t._slotInvalid = t.template.querySelector('slot[name="invalid"]');
            t.childNodes.forEach(node => {
                if (!node || !node.hasAttribute) return;
                if (!node.hasAttribute('slot')) {
                    if (node.nodeName === 'PRE') {
                        node.setAttribute('slot', 'valid');
                    } else {
                        let pre = webui.create('pre', { slot: 'valid' });
                        t.insertBefore(pre, node);
                        pre.appendChild(node);
                    }
                } else if (node.nodeName !== 'PRE') {
                    let pre = webui.create('pre', { slot: node.getAttribute('slot') });
                    t.insertBefore(pre, node);
                    pre.appendChild(node);
                }
            });
        },
        attr: ['data-subscribe', 'value'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'dataSubscribe':
                    t.checkConditions();
                    break;
                case 'value':
                    if (t.valueIsGood(value)) {
                        t.showContent();
                    } else {
                        t.showInvalid();
                    }
                    break;
            }
        },
        connected: (t) => {
            t._isConnected = true;
            let content = [], invalid = [];
            t._slotValid.assignedElements().forEach(pre => {
                content.push(pre.innerHTML);
            });
            t._slotInvalid.assignedElements().forEach(pre => {
                invalid.push(pre.innerHTML);
            });
            t._cacheContent = content.join('\n');
            t._cacheInvalid = content.join('\n');
            t.checkConditions();
        },
        setValue: function (_val, _key) {
            this.checkConditions();
        },
        valueIsGood: function (val) {
            if (!val || ['0', 'false', 'null', 'undefined', '[]', '{}'].indexOf(val) !== -1 || (val.forEach && val.length === 0)) {
                return false;
            }
            return true;
        },
        checkConditions: function () {
            let t = this;
            if (!t._isConnected) return;
            let keys = t.dataset.subscribe;
            if (!keys) {
                t.showInvalid();
                return;
            }
            let isGood = true;
            keys.split('|').forEach(key => {
                let val = webui.getData(key);
                if (!t.valueIsGood(val)) {
                    isGood = false;
                }
            });
            if (isGood) {
                t.showContent();
            } else {
                t.showInvalid();
            }
        },

        showContent: function () {
            let t = this;
            if (t._isShowing !== 'content') {
                t._isShowing = 'content';
                webui.transferChildren(webui.create('div', { html: t._cacheContent }), t);
            }
        },
        showInvalid: function () {
            let t = this;
            if (t._isShowing !== 'invalid') {
                t._isShowing = 'invalid';
                webui.removeChildren(t, ch => {
                    return !ch || !ch.hasAttribute || !ch.hasAttribute('slot');
                });
            }
        },
        shadowTemplate: `
<slot></slot>
<slot name="valid"></slot>
<slot name="invalid"></slot>
<style style="text/css">
:host {
display:block;
width:100%;
width:-webkit-fill-available;
}
slot[name] {
display:none;
}
</style>
`
    });
}