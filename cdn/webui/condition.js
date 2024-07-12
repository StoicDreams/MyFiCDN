"use strict"
{
    webui.define("webui-condition", {
        constructor: (t) => {
            let content = webui.create('div');
            let invalid = webui.create('div');
            let toContent = [];
            let toInvalid = [];
            t.childNodes.forEach(node => {
                if (node.hasAttribute && node.hasAttribute('slot') && node.getAttribute('slot') === 'invalid') {
                    toInvalid.push(node);
                } else {
                    toContent.push(node);
                }
            });
            toContent.forEach(node => {
                content.appendChild(node);
            });
            toInvalid.forEach(node => {
                invalid.appendChild(node);
            });
            t._cacheContent = content.innerHTML.trim();
            t._cacheInvalid = invalid.innerHTML.trim();
        },
        attr: ['data-subscribe'],
        attrChanged: (t, _property, _value) => {
            t.checkConditions();
        },
        connected: (t) => {
            t._isConnected = true;
            t.checkConditions();
        },
        setValue: function (_val, _key) {
            this.checkConditions();
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
                if (!val || val === '[]' || val === '{}' || (val.forEach && val.length === 0)) {
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
                t.innerHTML = t._cacheContent;
            }
        },
        showInvalid: function () {
            let t = this;
            if (t._isShowing !== 'invalid') {
                t._isShowing = 'invalid';
                t.innerHTML = t._cacheInvalid;
            }
        },
        shadowTemplate: `
<style style="text/css">
:host {
display:block;
}
</style>
<slot></slot>
<slot name="invalid"></slot>
`
    });
}