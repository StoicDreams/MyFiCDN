/*!
 * Web UI Dialog Action - https://webui.stoicdreams.com/components#webui-dialog-action
 * A component for managing dialog actions within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    webui.define("webui-dialog-action", {
        content: true,
        watchVisibility: false,
        isInput: false,
        preload: '',
        apiMethod: 'post',
        contentType: 'application/json',
        constructor() {
            const t = this;
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
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'api':
                    if (!value) {
                        t.apiUrl = undefined;
                        t.apiMethod = 'post';
                        break;
                    }
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
        async setValue(value) {
            if (value === undefined) return;
            const t = this;
            let content = '';
            // Each key that opened the dialog is cleared, so setting the same value again opens it again.
            [t.dataset.subscribe, t.dataset.bind].filter(Boolean).join('|').split('|')
                .map(ds => ds.split(':')[0].trim()).filter(Boolean)
                .forEach(key => webui.setData(key, undefined));
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
                    // The alert is the last thing in the dialog. Under a long form it is out of sight, where a
                    // failed save looked as if nothing had happened, so it is brought into view.
                    const showError = message => {
                        alert.setValue(message, 'danger');
                        if (typeof alert.scrollIntoView === 'function') alert.scrollIntoView({ block: 'nearest' });
                    };
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
                                            // A success that isn't JSON still succeeded, and says what it says.
                                            let json = message;
                                            try {
                                                json = JSON.parse(message);
                                                message = json[t.jsonSuccess] || json.message || message;
                                            } catch { }
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
                                        // A failure with nothing to say still has to say something.
                                        message = message || `The request failed (${resp.status}). Nothing was saved.`;
                                        if (t.dataset.exception) webui.setData(t.dataset.exception, message);
                                        showError(message);
                                    }
                                })
                                .catch(ex => {
                                    if (t.dataset.exception) webui.setData(t.dataset.exception, `${ex}`);
                                    showError(`${ex}`);
                                    resolve(false);
                                });
                        } else {
                            resolve(true);
                        }
                    });
                }
            }).catch(_ => { });
        },
        connected() {
            this.setupComponent();
        },
        disconnected() { },
        reconnected() { },
        setupComponent() { },
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
