/* Display feedback button that opens dialog for feedback when clicked */
"use strict"
{
    const template = document.createElement('template')
    template.setAttribute('shadowrootmode', true);
    template.innerHTML = `
<style type="text/css">
:host {
display:inline-flex;
cursor:pointer;
padding:1px;
align-items:center;
justify-content:center;
}
</style>
<webui-fa icon="comment" family="solid"></webui-fa>
`;
    const content = `
<webui-inputmessage autofocus></webui-inputmessage>
<webui-alert id="alert"></webuialert>
`;
    class Feedback extends HTMLElement {
        constructor() {
            super();
            const shadow = this.attachShadow({ mode: 'open' });
            let extraContent = this.innerHTML;
            const t = this;
            t.template = template.content.cloneNode(true);
            shadow.appendChild(t.template);
            t.addEventListener('click', async () => {
                let options = {
                    title: `Give us your Feedback!`,
                    minWidth: '80%'
                };
                let postUrl = t.dataset.post;
                if (postUrl) {
                    options.onconfirm = (data, content) => {
                        return new Promise((resolve) => {
                            let alert = content.querySelector('#alert');
                            let input = content.querySelector('webui-inputmessage');
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
                    console.log(ex);
                }
            });
        }
        static get observedAttributes() {
            return ['title', 'data-post'];
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            this[property] = newValue;
        }
        connectedCallback() {
            if (!this.getAttribute('preload')) {
                this.setAttribute('preload', 'dialogs inputmessage alert alerts');
            }
        }
        disconnectedCallback() { }
    }
    customElements.define('webui-feedback', Feedback);
}
