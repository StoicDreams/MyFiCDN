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
<webui-alert id="alert"></webuialert>
`;

    webui.define('webui-feedback', {
        preload: 'dialogs input-message alert alerts',
        constructor: (t) => {
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
                                ct = 'multipart/form-data';
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
                                    headers: {
                                        'Content-Type': ct
                                    }
                                })
                                    .then(async result => {
                                        let body = await result.text();
                                        if (result.status >= 200 && result.status < 300) {
                                            webuiAlert(body, 'success');
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
        setTheme: function (value) {
            const t = this;
            t._icon.setAttribute('theme', value);
        },
        attr: ['title', 'data-post', 'flags'],
        attrChanged: (t, property, value) => {
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
        connected: (t) => {
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
