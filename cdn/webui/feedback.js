/* Display feedback button that opens dialog for feedback when clicked */
"use strict"
{
    const content = `
<webui-input-message theme="primary" label="Enter your feedback here!" autofocus></webui-input-message>
<webui-alert id="alert"></webuialert>
`;

    webui.define('webui-feedback', {
        preload: 'dialogs input-message alert alerts',
        constructor: (t) => {
            let extraContent = t.innerHTML;
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
                            let body = input.value;
                            let ct = 'text/plain';
                            if (t.dataset.jsonName) {
                                ct = 'application/json';
                                let o = {};
                                o[t.dataset.jsonName] = input.value;
                                body = JSON.stringify(o);
                            }
                            else if (t.dataset.formName) {
                                ct = 'multipart/form-data';
                                data.append(t.dataset.formName, input.value);
                                body = data;
                            }
                            if (input.value) {
                                fetch(postUrl, {
                                    method: 'POST',
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
                    await webuiDialog(options);
                } catch (ex) {
                    if (ex === 'canceled') return;
                    console.error('Unexpected error from feedback->webuiDialog()', ex);
                }
            });
        },
        attr: ['title', 'data-post'],
        connected: (t) => {
            t.setAttribute('data-subscribe', 'feedback:click');
        },
        shadowTemplate: `
<style type="text/css">
:host {
display:inline-flex;
cursor:pointer;
padding:1px;
align-items:center;
justify-content:center;
}
</style>
<webui-fa icon="comment"></webui-fa>
`
    });
}
