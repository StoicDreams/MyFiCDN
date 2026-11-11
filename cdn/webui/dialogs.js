/*!
 * Web UI Dialogs - https://webui.stoicdreams.com/components#webui-dialogs
 * A component for displaying and managing dialogs within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
const webuiDialog = function (data) {
    if (webuiDialog._handler) return webuiDialog._handler(data);
    // The handler is set up when webui-dialogs connects, which can be after a page's first call while it starts,
    // so hold the dialog until then. Closing it first means it never opens.
    let opened = null;
    let closed = false;
    const promise = new Promise((resolve, reject) => {
        webuiDialog._pending.push(() => {
            if (closed) return;
            opened = webuiDialog._handler(data);
            opened.then(resolve, reject);
        });
    });
    promise.close = () => {
        closed = true;
        opened?.close();
    };
    return promise;
}
webuiDialog._pending = [];
{
    const defaultDialogOptions = { content: "Missing Content", confirm: "Ok" };
    const defaultWaitOptions = { hideclose: true, ignoreBackdropClick: true, content: 'Loading, please wait!' };
    // The helpers close the dialog unless their callback explicitly returns false, including async callbacks.
    function closeUnlessFalse(result) {
        if (result && result.then) {
            return result.then(closeUnlessFalse);
        }
        return result !== false;
    }
    webui.dialog = webuiDialog;
    webui.dialog.confirm = function (message, onSuccess, onCancel) {
        const dialogPromise = webuiDialog({
            content: message,
            confirm: "Confirm",
            cancel: "Cancel",
            onconfirm: onSuccess ? (...args) => closeUnlessFalse(onSuccess(...args)) : undefined
        });
        if (onCancel) {
            dialogPromise.catch((reason) => {
                if (reason === 'canceled') {
                    onCancel();
                }
            });
        }
        return dialogPromise;
    };
    webui.dialog.prompt = function (message, defaultValue = '', onSubmit, onCancel) {
        const inputHtml = `
            <label style="display:flex; flex-direction:column; gap:0.5em;">
                ${message}
                <input type="text" name="prompt_value" value="${webui.escapeHtml(`${defaultValue}`)}" required autofocus />
            </label>
        `;
        const dialogPromise = webuiDialog({
            content: inputHtml,
            confirm: "Submit",
            cancel: "Cancel",
            onconfirm: (formData) => {
                return closeUnlessFalse(onSubmit ? onSubmit(formData.get('prompt_value')) : true);
            }
        });
        if (onCancel) {
            dialogPromise.catch((reason) => {
                if (reason === 'canceled') onCancel();
            });
        }
        return dialogPromise;
    };
    // Inputs inside components are in their shadow roots, so search those too, in document order.
    const inputSelector = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';
    const skippedInputTypes = ['hidden', 'button', 'submit', 'reset', 'image'];
    function findInputs(root, found = []) {
        for (const el of root.children) {
            if (el.matches(inputSelector)) found.push(el);
            if (el.shadowRoot) findInputs(el.shadowRoot, found);
            findInputs(el, found);
        }
        return found;
    }
    function canFocus(el) {
        if (el.disabled || el.readOnly) return false;
        if (el.tagName === 'INPUT' && skippedInputTypes.includes((el.type || '').toLowerCase())) return false;
        return el.getClientRects().length > 0;
    }
    function getDeepActiveElement() {
        let active = document.activeElement;
        while (active && active.shadowRoot && active.shadowRoot.activeElement) {
            active = active.shadowRoot.activeElement;
        }
        return active;
    }
    webui.dialog.wait = async function (taskPromise, message = 'Loading, please wait...') {
        const dialogPromise = webuiDialog({
            isLoading: true,
            content: message
        });
        try {
            const result = await taskPromise;
            return result;
        } finally {
            if (dialogPromise.close) {
                dialogPromise.close();
            }
        }
    };
    webui.define("webui-dialogs", {
        preload: 'icon alert',
        linkCss: true,
        connected() {
            // Dialogs asked for before this was on the page, which can only open now.
            webuiDialog._pending.splice(0).forEach(open => open());
        },
        constructor() {
            const t = this;
            webuiDialog.alert = webui.alert;
            t.dialog = t.template.querySelector('dialog');
            t.form = t.template.querySelector('form');
            t.header = t.template.querySelector('form>header>section');
            t.content = t.template.querySelector('form>section');
            t.footer = t.template.querySelector('form>footer');
            t.btnClose = t.template.querySelector('#dlg-close');
            t.btnConfirm = t.template.querySelector('#dlg-confirm');
            t.btnCancel = t.template.querySelector('#dlg-cancel');
            let close = () => { };
            t.form.addEventListener('submit', ev => {
                ev.preventDefault();
                t._onsubmit();
            });
            document.body.addEventListener('keyup', ev => {
                if (ev.key === 'Escape' && !t._ignoreBackdropClick) {
                    close(true);
                }
            });
            t.dialog.addEventListener('cancel', ev => {
                if (t._ignoreBackdropClick) {
                    ev.preventDefault();
                }
            });
            t.btnClose.addEventListener('click', () => close(true));
            t.dialog.addEventListener('click', ev => {
                if (t._ignoreBackdropClick) return;
                // Backdrop clicks target the dialog itself. Keyboard activated buttons report 0,0 coordinates, which would otherwise look like one.
                if (ev.target !== t.dialog) return;
                const rect = t.dialog.getBoundingClientRect();
                const isInDialog = (
                    rect.top <= ev.clientY &&
                    ev.clientY <= rect.top + rect.height &&
                    rect.left <= ev.clientX &&
                    ev.clientX <= rect.left + rect.width
                );
                if (!isInDialog) {
                    close(true);
                }
            });
            if (!webuiDialog._handler) {
                webuiDialog._handler = function (data) {
                    let promise = new Promise((resolve, reject) => {
                        resetNodes();
                        t.content.alert = function (message, variant = 'danger') {
                            let alertNode = t.content.querySelector('webui-alert');
                            if (!alertNode && !message) return;
                            if (!alertNode) {
                                alertNode = document.createElement('webui-alert');
                                alertNode.style.marginBottom = 'var(--padding)';
                                t.content.appendChild(alertNode);
                            }
                            alertNode.setAttribute('variant', variant);
                            if (message) {
                                alertNode.setAttribute('show', true);
                            } else {
                                alertNode.removeAttribute('show');
                            }
                            alertNode.innerHTML = message || '';
                        };
                        webuiDialog.alert = t.content.alert;
                        data = data || defaultDialogOptions;
                        let defaultSet = data.isLoading ? defaultWaitOptions : defaultDialogOptions;
                        if (data.isLoading) {
                            data = { ...defaultWaitOptions, ...data };
                        }
                        t._onsubmit = async function () {
                            let formData = new FormData(t.form);
                            let result = undefined;
                            t.content.alert();
                            if (data.onconfirm) {
                                if (data.onconfirm.constructor && data.onconfirm.constructor.name === 'AsyncFunction') {
                                    result = await data.onconfirm(formData, t.content);
                                } else {
                                    result = data.onconfirm(formData, t.content);
                                }
                                if (result && result.then) {
                                    result = await result;
                                }
                                if (!result) {
                                    return;
                                }
                            }
                            let canClose = result === undefined || result === null || !!result;
                            if (canClose) {
                                resolve(formData, t.content);
                                close(false);
                            }
                        };
                        t._ignoreBackdropClick = !!data.ignoreBackdropClick;
                        t.dialog.style.minWidth = data.minWidth || '';
                        setContent(t.content, data.content || defaultSet.content);
                        setContent(t.btnCancel, data.cancel || defaultSet.cancel);
                        setContent(t.btnConfirm, data.confirm || defaultSet.confirm);
                        setContent(t.header, data.title || '');
                        if (data.isLoading) {
                            t.dialog.classList.add('isloading');
                        }
                        else if (data.hideclose) {
                            t.dialog.classList.remove('isloading');
                            t.dialog.setAttribute('data-hideclose', true);
                        } else {
                            t.dialog.classList.remove('isloading');
                            t.dialog.removeAttribute('data-hideclose');
                        }
                        close = (canceled) => {
                            t.content.alert();
                            if (data.onclose) { data.onclose(); }
                            if (canceled) reject('canceled');
                            t.dialog.close();
                            close = () => { };
                            webuiDialog.alert = webui.alert;
                        };
                        t.btnCancel.addEventListener('click', () => close(true));
                        t.btnConfirm.addEventListener('click', ev => {
                            ev.preventDefault();
                            t._onsubmit();
                        });
                        t.dialog.showModal();
                        focusFirstInput();
                    });
                    promise.close = () => {
                        close();
                    };
                    return promise;
                };
            }
            // Components in the content load and render after the dialog opens, so keep looking for a
            // short while. Stop if another dialog opens, this one closes, or the user moves focus.
            function focusFirstInput() {
                const token = t._focusToken = {};
                const content = t.content;
                const startedWith = getDeepActiveElement();
                const started = Date.now();
                const attempt = () => {
                    if (t._focusToken !== token || !t.dialog.open) return;
                    if (getDeepActiveElement() !== startedWith) return;
                    const inputs = findInputs(content).filter(canFocus);
                    const target = inputs.find(el => el.hasAttribute('autofocus')) || inputs[0];
                    if (target) {
                        target.focus();
                        return;
                    }
                    if (Date.now() - started < 3000) setTimeout(attempt, 50);
                };
                attempt();
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
        },
        shadowTemplate: `
<dialog data-stopclick aria-labelledby="dlg-title">
<form method="dialog">
<header>
<section id="dlg-title"></section>
<button id="dlg-close" value="cancel" type="button" formmethod="dialog" aria-label="Close"><webui-icon icon="xmark"></webui-icon></button>
</header>
<section></section>
<footer>
<button id="dlg-cancel" value="cancel" type="button" formmethod="dialog" formnovalidate></button>
<span></span>
<button id="dlg-confirm" value="confirm" type="submit" formmethod="dialog"></button>
</footer>
</form>
</dialog>
<style type="text/css">
:host {
background-color:inherit;
color:inherit;
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
background-color:inherit;
color:inherit;
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
dialog.isloading header,
dialog.isloading footer,
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
`
    });
}
