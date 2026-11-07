/*!
 * Web UI Feedback - https://webui.stoicdreams.com/components#webui-feedback
 * Display feedback button that opens dialog for feedback when clicked.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    const content = `
<webui-input-message name="message" theme="primary" tab label="Enter your feedback here!" autofocus></webui-input-message>
<webui-alert id="alert"></webui-alert>
`;

    webui.define('webui-feedback', {
        preload: 'dialogs input-message alert alerts',
        constructor() {
            const t = this;
            let extraContent = t.innerHTML;
            t._icon = t.template.querySelector('webui-icon');
            t.addEventListener('click', async _ => {
                let options = {
                    title: `Give us your Feedback!`,
                    minWidth: '80%'
                };
                let postUrl = t.dataset.post;
                if (postUrl) {
                    options.onconfirm = (data, content) => {
                        return new Promise((resolve) => {
                            let alert = content.querySelector('#alert');
                            let input = content.querySelector('webui-input-message');
                            alert.removeAttribute('show');
                            let body = input.value.trim();
                            let ct = 'text/plain';
                            if (t.dataset.jsonName) {
                                ct = 'application/json';
                                let o = {};
                                o[t.dataset.jsonName] = body;
                                body = JSON.stringify(o);
                            }
                            else if (t.dataset.formName) {
                                ct = undefined;
                                data.append(t.dataset.formName, body);
                                body = data;
                            }
                            if (body) {
                                fetch(postUrl, {
                                    method: 'POST',
                                    credentials: 'include',
                                    mode: 'cors',
                                    cache: 'no-cache',
                                    body: body,
                                    // Without a type the browser sets multipart/form-data along with its boundary.
                                    headers: ct ? { 'Content-Type': ct } : {}
                                })
                                    .then(async result => {
                                        let body = await result.text();
                                        if (result.status >= 200 && result.status < 300) {
                                            webui.alert(body, 'success');
                                            resolve(true);
                                        } else {
                                            alert.innerHTML = `${body}`;
                                            alert.setAttribute('variant', 'danger');
                                            alert.setAttribute('show', true);
                                            resolve(false);
                                        }
                                    })
                                    .catch(err => {
                                        alert.innerHTML = `${err}`;
                                        alert.setAttribute('variant', 'danger');
                                        alert.setAttribute('show', true);
                                        resolve(false);
                                    });
                            } else {
                                alert.innerHTML = 'Please provide a message.';
                                alert.setAttribute('variant', 'info');
                                alert.setAttribute('show', true);
                                resolve(false);
                            }
                        });
                    };
                    options.content = `${extraContent}${content}`;
                    options.confirm = 'Send Feedback';
                    options.cancel = 'Cancel';
                } else {
                    options.content = 'Attribute data-post="https://..." needs to be set.'
                }
                try {
                    await webui.dialog(options);
                } catch (ex) {
                    if (ex === 'canceled') return;
                    console.error('Unexpected error from feedback->webui.dialog()', ex);
                }
            });
        },
        setTheme(value) {
            const t = this;
            t._icon.setAttribute('theme', value);
        },
        attr: ['title', 'data-post', 'flags'],
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'flags':
                    if (typeof value === 'string') {
                        value.split(' ').forEach(flag => {
                            let fa = flag.split(':');
                            t._icon.setAttribute(fa[0], fa[1] || '');
                        });
                    }
                    break;
            }
        },
        connected() {
            const t = this;
            // These open a dialog or panel when clicked, so keyboard users need them to work as buttons too.
            if (!t.hasAttribute('role')) t.setAttribute('role', 'button');
            if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '0');
            if (!t.hasAttribute('aria-label')) t.setAttribute('aria-label', t.getAttribute('title') || 'Give feedback');
            if (!t._keyboardReady) {
                t._keyboardReady = true;
                t.addEventListener('keydown', ev => {
                    if (ev.key !== 'Enter' && ev.key !== ' ') return;
                    ev.preventDefault();
                    t.click();
                });
            }
            t.addDataset('subscribe', 'feedback:click');
        },
        shadowTemplate: `
<webui-icon icon="feedback" fill></webui-icon>
<style type="text/css">
:host {
display:inline-flex;
cursor:pointer;
padding:1px;
align-items:center;
justify-content:center;
}
</style>
`
    });
}
