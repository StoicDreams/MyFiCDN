/*!
 * Web UI Dialogs - https://webui.stoicdreams.com/components#webui-dialogs
 * A component for displaying and managing dialogs within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
const webuiDialog = function (data) {
    return webuiDialog._handler(data);
}
{
    const defaultDialogOptions = { content: "Missing Content", confirm: "Ok" };
    const defaultWaitOptions = { hideclose: true, ignoreBackdropClick: true, content: 'Loading, please wait!' };
    webui.dialog = webuiDialog;
    webui.define("webui-dialogs", {
        preload: 'icon',
        linkCss: true,
        constructor() {
            const t = this;
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
                if (ev.key === 'Escape') {
                    close(true);
                }
            });
            t.dialog.addEventListener('click', ev => {
                if (t._ignoreBackdropClick) return;
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
                        data = data || defaultDialogOptions;
                        let defaultSet = data.isLoading ? defaultWaitOptions : defaultDialogOptions;
                        if (data.isLoading) {
                            data = { ...defaultWaitOptions, ...data };
                        }
                        t._onsubmit = async function () {
                            let formData = new FormData(t.form);
                            let result = undefined;
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
                            if (data.onclose) { data.onclose(); }
                            if (canceled) reject('canceled');
                            t.dialog.close();
                            close = () => { };
                        };
                        t.btnClose.addEventListener('click', () => close(true));
                        t.btnCancel.addEventListener('click', () => close(true));
                        t.btnConfirm.addEventListener('click', ev => {
                            ev.preventDefault();
                            t._onsubmit();
                        });
                        t.dialog.showModal();
                    });
                    promise.close = () => {
                        close();
                    };
                    return promise;
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
        },
        shadowTemplate: `
<dialog>
<form method="dialog">
<header>
<section></section>
<button id="dlg-close" value="cancel" type="button" formmethod="dialog"><webui-icon icon="xmark"></webui-icon></button>
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
