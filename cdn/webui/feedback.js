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
padding:var(--button-padding, 0.5em 1em);
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
            if (!t.getAttribute('preload')) {
                t.setAttribute('preload', 'dialogs inputmessage alert');
            }
            shadow.appendChild(t.template);
            t.addEventListener('click', async () => {
                let options = {
                    title: `Give us your Feedback!`,
                    minWidth: '80%'
                };
                let postUrl = t.getAttribute('data-post');
                if (postUrl) {
                    options.onconfirm = (data, content) => {
                        let alert = content.querySelector('#alert');
                        let input = content.querySelector('webui-inputmessage');
                        alert.removeAttribute('show');
                        let body = JSON.stringify({
                            message: input.value
                        });
                        console.log('body', body);
                        if (input.value) {
                            fetch(postUrl, {
                                method: 'POST',
                                mode: 'cors',
                                credentials: 'include',
                                cache: 'no-cache',
                                body: body,
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            })
                                .then(result => {
                                    console.log('Success', result);
                                })
                                .catch(err => {
                                    console.log('Fail', err.message, err.status, err);
                                    alert.innerHTML = `${err}`;
                                    alert.setAttribute('variant', 'danger');
                                    alert.setAttribute('show', true);
                                });
                        } else {
                            alert.innerHTML = 'Please provide a message.';
                            alert.setAttribute('variant', 'info');
                            alert.setAttribute('show', true);
                        }
                        return false;
                    };
                    options.content = `${extraContent}${content}`;
                    options.confirm = 'Send Feedback';
                    options.cancel = 'Cancel';
                } else {
                    options.content = 'Attribute data-post="https://..." needs to be set.'
                }
                try {
                    let result = await webuiDialog(options);
                    console.log(result);
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
        connectedCallback() { }
        disconnectedCallback() { }
    }
    customElements.define('webui-feedback', Feedback);
}
