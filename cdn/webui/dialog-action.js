"use strict"
{
    webui.define("webui-dialog-action", {
        content: true,
        linkCss: false,
        watchVisibility: false,
        isInput: false,
        preload: '',
        apiMethod: 'post',
        contentType: 'application/json',
        constructor: (t) => {
            t._slotMain = t.template.querySelector('slot:not([name])');
            t._slotSomething = t.template.querySelector('slot[name="something"]');
        },
        props: {
            'sample': {
                get() { return this._sample; },
                set(v) { this._sample = v; }
            }
        },
        flags: [],
        attr: ['api', 'confirm', 'content-type'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'api':
                    let segments = value.split('|');
                    let api = value;
                    if (segments.length > 1 && ['get', 'post', 'put', 'delete', 'patch'].indexOf(segments[0].toLowercase()) !== -1) {
                        t.apiMethod = segments[0];
                        api = segments[1];
                    }
                    if (api) {
                        t.apiUrl = api;
                    }
                    break;
                case 'maxHeight':
                    t.style.maxHeight = webui.pxIfNumber(value);
                    break;
            }
        },
        setValue: async function (value) {
            if (value === undefined) return;
            const t = this;
            let content = '';
            if (t.dataset.subscribe) {
                webui.setData(t.dataset.subscribe, undefined);
            }
            console.log('assigned', t._slotMain.assignedElements());
            t._slotMain.assignedElements().forEach(node => {
                console.log('node', node, node.nodeName);
                switch (node.nodeName) {
                    case 'TEMPLATE':
                        content = `${content}${node.innerHTML}`;
                        break;
                    default:
                        if (node.outerHTML) {
                            content = `${content}${node.outerHTML}`;
                        }
                        break;
                }
            });
            webui.dialog({
                confirm: t.confirm || 'Confirm',
                cancel: 'Cancel',
                content: content,
                title: t.title || 'Action',
                minWidth: '80%',
                onconfirm: (data, content) => {
                    return new Promise((resolve) => {
                        let method = t.apiMethod;
                        let url = t.apiUrl;
                        if (url) {
                            let ct = t.contentType || 'application/json';
                            let fetchData = null;
                            if (method.toLowercase() !== 'get') {
                                if (ct === 'multipart/form-data') {
                                    fetchData = data;
                                } else {
                                    fetchData = Object.fromEntries(data);
                                    if (Object.keys(fetchData).length === 0) {
                                        Object.assign(fetchData, value);
                                    }
                                    fetchData.headers = {
                                        'Content-Type': ct
                                    };
                                }
                            }
                            webui.fetchApi(url, fetchData, method)
                                .then(async resp => {
                                    let message = await resp.text();
                                    if (resp.status < 300) {
                                        resolve(true);
                                        if (message) {
                                            webui.alert(message, 'success');
                                        }
                                    } else {
                                        resolve(false);
                                        if (message) {
                                            webui.alert(message);
                                        }
                                    }
                                })
                                .catch(ex => {
                                    resolve(false);
                                });
                            return true;
                        } else {
                            resolve(true);
                        }
                    });
                }
            }).catch(_ => { });
        },
        connected: function (t) {
            t.setupComponent();
        },
        disconnected: function (t) { },
        reconnected: function (t) { },
        setupComponent: function () {
            const t = this;
        },
        shadowTemplate: `
<slot></slot>
<slot name="something"></slot>
<style type="text/css">
:host {
display:none;
}
</style>
`
    });
}
