/* Enables use of await webuiDialog(options) to call a dialog */
"use strict"
{
    const template = document.createElement('template')
    template.setAttribute('shadowrootmode', true);
    template.innerHTML = `
<style type="text/css">
:host {
}
dialog {
display:none;
opacity:0;
padding:0;
transform:scaleY(0) scaleX(0) scaleZ(0.8) translateX(-500px) translateY(500px);
border-radius:var(--corners, 0);
border:none;
max-width:80%;
max-height:80%;
flex-direction:column;
transition:
opacity 0.4s ease-out,
transform 0.4s ease-out,
overlay 0.4s ease-out allow-discrete,
display 0.4s ease-out allow-discrete;
}
dialog[open] {
display:flex;
opacity:1;
transform:scaleY(1) scaleX(1) scaleZ(1) translateX(0) translateY(0px);
}
form>header,
form>section,
form>footer {
display:flex;
gap: var(--padding, 1em);
padding:var(--padding, 1em);
}
form>header,
form>footer {
flex-direction:row;
}
form>section {
flex-direction:column;
overflow:auto;
max-height:calc(var(--window-height) * 0.8 - 10em);
}
header>section,
footer>span {
flex-grow:1;
}
form>header{
background-color:var(--color-title);
color:var(--color-title-offset);
}
form>footer {
background-color:var(--color-footer);
color:var(--color-footer-offset);
}
dialog::backdrop {
background-color: rgb(0 0 0 / 0%);
backdrop-filter:blur(0);
transition:
display 0.4s allow-discrete,
overlay 0.4s allow-discrete,
background-color 0.4s;
}
dialog[open]::backdrop {
background-color: rgb(0 0 0 / 50%);
backdrop-filter:var(--backdrop-blur, blur(5px));
}
@starting-style {
dialog[open] {
opacity:0;
transform:scaleY(0) scaleX(0) scaleZ(0.8) translateX(500px) translateY(-500px);
}
dialog[open]::backdrop {
background-color: rgb(0 0 0 / 0%);
backdrop-filter:blur(0);
}
}
button {
display:inline-flex;
cursor:pointer;
padding:var(--button-padding, 0.5em 1em);
align-items:center;
justify-content:center;
border:none;
background:none;
color:inherit;
border-radius:var(--corners);
}
button:empty {display:none;}
dialog[data-hideclose] button#dlg-close {
display:none;
}
button#dlg-cancel {
background-color:var(--color-warning, #666);
color:var(--color-warning-offset, #CCC);
}
button#dlg-confirm {
background-color:var(--color-success, #555);
color:var(--color-success-offset, #FFF);
}
</style>
<dialog>
<form method="dialog">
<header>
<section></section>
<button id="dlg-close" value="cancel" formmethod="dialog"><webui-fa icon="xmark"></webui-fa></button>
</header>
<section></section>
<footer>
<button id="dlg-cancel" value="cancel" formmethod="dialog" formnovalidate></button>
<span></span>
<button id="dlg-confirm" value="confirm" formmethod="dialog"></button>
</footer>
</form>
</dialog>
`;
    function ce(n, cls) {
        let el = document.createElement(n);
        el.className = cls;
        return el;
    }
    const defaultData = { content: "Missing Content", confirm: "Ok" };
    class Dialog extends HTMLElement {
        constructor() {
            super();
            const shadow = this.attachShadow({ mode: 'open' });
            const t = this;
            t.template = template.content.cloneNode(true);
            t.dialog = t.template.querySelector('dialog');
            t.form = t.template.querySelector('form');
            t.header = t.template.querySelector('form>header>section');
            t.content = t.template.querySelector('form>section');
            t.footer = t.template.querySelector('form>footer');
            t.btnClose = t.template.querySelector('#dlg-close');
            t.btnConfirm = t.template.querySelector('#dlg-confirm');
            t.btnCancel = t.template.querySelector('#dlg-cancel');
            shadow.appendChild(t.template);
            let close = () => { };
            document.body.addEventListener('keyup', ev => {
                if (ev.key === 'Escape') {
                    close(true);
                }
            });
            if (!window.webuiDialog) {
                window.webuiDialog = function (data) {
                    return new Promise((resolve, reject) => {
                        resetNodes();
                        data = data || defaultData;
                        t.dialog.style.minWidth = data.minWidth || '';
                        setContent(t.content, data.content || defaultData.content);
                        setContent(t.btnCancel, data.cancel || defaultData.cancel);
                        setContent(t.btnConfirm, data.confirm || defaultData.confirm);
                        setContent(t.header, data.title || '');
                        if (data.hideclose) {
                            t.dialog.setAttribute('data-hideclose', true);
                        } else {
                            t.dialog.removeAttribute('data-hideclose');
                        }
                        close = (canceled) => {
                            if (data.onclose) { data.onclose(); }
                            if (canceled) reject('canceled');
                            t.dialog.close();
                            close = () => { };
                        };
                        t.btnClose.addEventListener('click', () => close(true));
                        t.btnCancel.addEventListener('click', () => close(true));
                        t.btnConfirm.addEventListener('click', async (ev) => {
                            ev.preventDefault();
                            let formData = new FormData(t.form);
                            if (data.onconfirm) {
                                if (data.onconfirm.constructor && data.onconfirm.constructor.name === 'AsyncFunction') {
                                    let result = await data.onconfirm(formData, t.content);
                                    if (!result) {
                                        return;
                                    }
                                } else {
                                    let result = data.onconfirm(formData, t.content);
                                    if (result.then) {
                                        result = await result;
                                        if (!result) {
                                            return;
                                        }
                                    } else if (!result) {
                                        return;
                                    }
                                }
                            }
                            resolve(formData, t.content);
                            close(false);
                        });
                        t.dialog.showModal();
                    });
                };
            }
            function setContent(el, content) {
                content = content || ``;
                if (content.nodeType) {
                    el.appendChild(content);
                    return;
                }
                el.innerHTML = content;
            }
            function resetNodes() {
                t.header = replaceNode(t.header);
                t.content = replaceNode(t.content);
                t.btnCancel = replaceNode(t.btnCancel);
                t.btnConfirm = replaceNode(t.btnConfirm);
            }
            function replaceNode(node) {
                let c = node.cloneNode();
                node.parentNode.insertBefore(c, node);
                node.remove();
                return c;
            }
        }
        static get observedAttributes() {
            return [];
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            this[property] = newValue;
            this.updateElements();
        }
        connectedCallback() {
            if (!this.getAttribute('preload')) {
                this.setAttribute('preload', 'fa');
            }
        }
        disconnectedCallback() { }
    }
    customElements.define('webui-dialogs', Dialog);
}
