"use strict"
{
    webui.define("webui-condition", {
        constructor: (t) => {
            t._data = {};
            t._slotValid = t.template.querySelector('slot[name="valid"]');
            t._slotInvalid = t.template.querySelector('slot[name="invalid"]');
            // auto-assign unslotted template elements to valid
            t.childNodes.forEach(node => {
                if (!node || !node.hasAttribute) return;
                if (node.nodeName === 'TEMPLATE' && !node.hasAttribute('slot')) {
                    node.setAttribute('slot', 'valid');
                }
            });
            t.querySelectorAll('p > template').forEach(template => {
                if (!template.hasAttribute('slot')) {
                    template.setAttribute('slot', 'valid');
                }
                t.appendChild(template);
            });
            t.querySelectorAll('p').forEach(p => {
                if (p.innerHTML.trim() === '') {
                    p.remove();
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
                    t.dataset.value = value;
                    t.checkConditions();
                    break;
            }
        },
        connected: (t) => {
            t._isConnected = true;
            let content = [], invalid = [];
            t._slotValid.assignedElements().forEach(template => {
                content.push(template.innerHTML);
            });
            t._slotInvalid.assignedElements().forEach(template => {
                invalid.push(template.innerHTML);
            });
            t._cacheContent = content.join('\n');
            t._cacheInvalid = invalid.join('\n');
            t.checkConditions();
        },
        setValue: function (value, key) {
            let t = this;
            switch (key) {
                case 'value':
                    t.dataset.value = value;
                    break;
            }
            t._data[key] = value === undefined ? '' : value;
            t.checkConditions();
        },
        valueIsGood: function (val) {
            if (!val || ['0', 'false', 'null', 'undefined', '[]', '{}'].indexOf(val) !== -1 || (val.forEach && val.length === 0)) {
                return false;
            }
            if (typeof val === 'string' && val.startsWith('{TEMPLATE_')) return false;
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
            let isGeneralCheck = mustEqual === undefined && mustContain === undefined && notEqual === undefined && mustMatch === undefined;
            function checkValue(value) {
                let vt = `${value}`;
                if (ignoreCase) {
                    vt = vt.toLowerCase();
                }
                if (isGeneralCheck) {
                    if (!t.valueIsGood(value)) {
                        isGood = false;
                    }
                    return;
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
            webui.removeChildren(t, ch => {
                return !ch || !ch.hasAttribute || !ch.hasAttribute('slot');
            });
            if (t._cacheContent) {
                webui.transferChildren(webui.create('div', { html: webui.applyAppDataToContent(t._cacheContent, t._data) }), t);
            }
        },
        showInvalid: function () {
            let t = this;
            webui.removeChildren(t, ch => {
                return !ch || !ch.hasAttribute || !ch.hasAttribute('slot');
            });
            if (t._cacheInvalid) {
                webui.transferChildren(webui.create('div', { html: webui.applyAppDataToContent(t._cacheInvalid, t._data) }), t);
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