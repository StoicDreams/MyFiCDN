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
        attr: ['api', 'confirm', 'content-type', 'data-success', 'data-exception', 'json-success', 'header-message'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'api':
                    let segments = value.split('|');
                    let api = value;
                    if (segments.length > 1 && ['get', 'post', 'put', 'delete', 'patch'].indexOf(segments[0].toLowerCase()) !== -1) {
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
            t._slotMain.assignedElements().forEach(node => {
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
            content = webui.replaceAppData(`${content}<webui-alert></webui-alert>`);
            let url = t.apiUrl;
            webui.dialog({
                confirm: t.confirm || 'Confirm',
                cancel: url ? 'Cancel' : null,
                content: content,
                title: t.title || 'Action',
                minWidth: '80%',
                onconfirm: (data, content) => {
                    let alert = content.querySelector('webui-alert');
                    return new Promise((resolve) => {
                        let method = t.apiMethod;
                        if (url) {
                            let ct = t.contentType || 'application/json';
                            let fetchData = null;
                            if (method.toLowerCase() !== 'get') {
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
                                        if (t.jsonSuccess) {
                                            let json = await JSON.parse(message);
                                            message = json[t.jsonSuccess] || json.message || message;
                                            if (t.dataset.success) {
                                                webui.setData(t.dataset.success, json);
                                            }
                                        } else {
                                            if (t.dataset.success) {
                                                webui.setData(t.dataset.success, message);
                                            }
                                        }
                                        if (t.headerMessage) {
                                            message = webui.getResponseHeader(resp, ...t.headerMessage.split('|')) || message;
                                        }
                                        if (message) {
                                            webui.alert(message, 'success');
                                        }
                                    } else {
                                        resolve(false);
                                        if (t.headerMessage) {
                                            message = webui.getResponseHeader(resp, ...t.headerMessage.split('|')) || message;
                                        }
                                        if (message) {
                                            alert.setValue(message, 'danger');
                                        }
                                    }
                                })
                                .catch(ex => {
                                    resolve(false);
                                });
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
