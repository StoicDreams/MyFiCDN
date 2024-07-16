"use strict"
{
    webui.define("webui-condition", {
        constructor: (t) => {
            t._data = {};
            t._slotValid = t.template.querySelector('slot[name="valid"]');
            t._slotInvalid = t.template.querySelector('slot[name="invalid"]');
            // auto-assign unslotted pre elements to valid
            t.childNodes.forEach(node => {
                if (!node || !node.hasAttribute) return;
                if (node.nodeName === 'PRE' && !node.hasAttribute('slot')) {
                    node.setAttribute('slot', 'valid');
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
            t._cacheInvalid = invalid.join('\n');
            t.checkConditions();
        },
        setValue: function (value, _key) {
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
            if (!keys && !t.dataset.value) {
                t.showInvalid();
                return;
            }
            let mustEqual = t.dataset.equals;
            let mustContain = t.dataset.contains;
            let notEqual = t.dataset.unequals;
            let ignoreCase = t.dataset.ignoreCase !== undefined;
            let mustMatch = t.dataset.match;
            let isGood = true;
            function checkValue(value) {
                let vt = `${value}`;
                if (ignoreCase) {
                    vt = vt.toLowerCase();
                }
                if (mustMatch !== undefined) {
                    let matches = new RegExp(mustMatch, 'g');
                    if (!matches) {
                        isGood = false;
                    }
                }
                else if (notEqual !== undefined) {
                    if (value === notEqual || vt === notEqual) {
                        isGood = false;
                    }
                }
                else if (!t.valueIsGood(value)) {
                    isGood = false;
                }
                if (mustEqual !== undefined && (value !== mustEqual && vt !== mustEqual)) {
                    isGood = false;
                }
                if (mustContain !== undefined && vt.indexOf(mustContain) === -1) {
                    isGood = false;
                }
            }
            if (keys && keys.split) {
                keys.split('|').forEach(key => {
                    let val = webui.getData(key);
                    checkValue(val);
                });
            }
            if (t.dataset.value !== undefined) {
                console.log('check value', t.dataset.value);
                checkValue(t.dataset.value);
            }
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
                webui.removeChildren(t, ch => {
                    return !ch || !ch.hasAttribute || !ch.hasAttribute('slot');
                });
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
display:inline;
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