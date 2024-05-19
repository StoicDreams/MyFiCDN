/* Wrapper element for application - contains several app-level features for managing state and transferring data between elements within the app */
"use strict"
{
    //storage_accepted
    {
        function getStorage() {
            if (localStorage.storage_accepted) return localStorage;
            return sessionStorage;
        }
        function getNodeKey(node) {
            let segments = [];
            segments.push(node.nodeName.toLowerCase());
            if (node.classList.length) {
                segments.push(node.classList[0]);
            }
            ['id', 'name'].forEach(attr => {
                let val = node.attributes[attr];
                if (val && val.value) {
                    segments.join(`${attr}-${val.value}`);
                }
            });
            return segments.join('_');
        }
        function saveState(node) {
            let storage = getStorage();
            let key = getNodeKey(node);
            let state = {};
            node.dataset.state.split('|').forEach(attr => {
                let val = node.attributes[attr];
                if (val && val.value && val.value !== 'undefined') {
                    state[attr] = val.value;
                }
            });
            storage[key] = JSON.stringify(state);
        }
        function loadState(node) {
            let storage = getStorage();
            let key = getNodeKey(node);
            if (!storage[key]) return;
            let state = JSON.parse(storage[key]);
            node.dataset.state.split('|').forEach(attr => {
                if (state[attr]) {
                    node.setAttribute(attr, state[attr]);
                }
            });
        }
        function checkNodes(nodes) {
            if (nodes.length === 0) return;
            nodes.forEach(node => {
                if (node.dataset && node.dataset.state) {
                    loadState(node);
                }
                checkNodes(node.childNodes);
            });
        }
        function applyDataHide() {
            document.querySelectorAll('[data-hide]').forEach(el => {
                let sel = el.dataset.hide;
                if (!sel) return;
                let found = document.querySelector(sel);
                el.style.display = found ? '' : 'none';
            });
        }
        const startObserving = (domNode) => {
            const observer = new MutationObserver(mutations => {
                mutations.forEach(function (mutation) {
                    if (mutation.target && mutation.target.dataset && mutation.target.dataset.state) {
                        saveState(mutation.target);
                    }
                    Array.from(mutation.addedNodes).forEach(el => {
                        if (el.dataset && el.dataset.state) {
                            loadState(el);
                        }
                    });
                });
                applyDataHide();
            });
            observer.observe(domNode, {
                childList: true,
                attributes: true,
                characterData: true,
                subtree: true,
            });
            return observer;
        };
        startObserving(document.body);
        checkNodes(document.childNodes);
        applyDataHide();
    }
    // Data signalling/transfers
    {
        function handleDataTrigger(ev) {
            let el = ev.srcElement || ev.target;
            let key = el.dataset.trigger;
            if (!key) return;
            let value = el.value;
            document.querySelectorAll(`[data-subscribe="${key}"]`).forEach(sub => {
                let toSet = sub.dataset.set || 'innerText';
                sub[toSet] = value;
            });
        }
        function toggleAttr(el, attr) {
            if (el.getAttribute(attr)) {
                el.removeAttribute(attr);
            } else {
                el.setAttribute(attr, true);
            }
        }
        function toggleClass(el, cls) {
            if (el.classList.contains(cls)) {
                el.classList.remove(cls);
            } else {
                el.classList.add(cls);
            }
        }
        function removeClass(el, cls) {
            if (el.classList.contains(cls)) {
                el.classList.remove(cls);
            }
        }
        function setAttr(el, attr, val) {
            el.setAttribute(attr, val);
        }
        document.body.addEventListener('input', handleDataTrigger);
        document.body.addEventListener('change', handleDataTrigger);
        document.body.addEventListener('click', ev => {
            let target = ev.target;
            while (target !== document.body) {
                if (target.dataset.setattr) {
                    let [val, attr, sel] = target.dataset.setattr.split('|').reverse();
                    if (sel) {
                        document.querySelectorAll(sel).forEach(el => setAttr(el, attr, val));
                    } else {
                        setAttr(target, attr, val);
                    }
                    break;
                }
                if (target.dataset.toggleclass) {
                    let [cls, sel] = target.dataset.toggleclass.split('|').reverse();
                    if (sel) {
                        document.querySelectorAll(sel).forEach(el => toggleClass(el, cls));
                    } else {
                        toggleClass(target, cls);
                    }
                    break;
                }
                if (target.dataset.removeclass) {
                    target.dataset.removeclass.split(';').forEach(ds => {
                        let [cls, sel] = ds.split('|').reverse();
                        if (sel) {
                            document.querySelectorAll(sel).forEach(el => removeClass(el, cls));
                        } else {
                            removeClass(target, cls);
                        }
                    })
                }
                if (target.dataset.toggleattr) {
                    let [attr, sel] = target.dataset.toggleattr.split('|').reverse();
                    if (sel) {
                        document.querySelectorAll(sel).forEach(el => toggleAttr(el, attr));
                    } else {
                        toggleAttr(target, attr);
                    }
                    break;
                }
                target = target.parentNode;
            }
        });
    }
    // Web component
    const template = document.createElement('template')
    template.setAttribute('shadowrootmode', true);
    template.innerHTML = `
<style type="text/css">
:host {
background-color: var(--site-background-color, white);
color: var(--site-background-offset, black);
display: grid;
grid-template-columns: min-content auto min-content;
grid-template-rows: min-content min-content auto min-content min-content;
position: fixed;
left: 0;
top: 0;
width: 100%;
height: 100%;
overflow: auto;
}
::slotted([slot="header"]) {
grid-row: 2;
grid-column: 2;
display: flex!important;
align-items: start;
justify-items: start;
font-size: 1.2rem;
gap:var(--padding, 1em);
padding:var(--padding,1em);
}
::slotted([slot="footer"]) {
grid-row: 4;
grid-column: 2;
display: flex!important;
font-size: 0.8rem;
align-items:center;
padding:var(--padding, 1em);
vertical-align:middle;
gap:var(--padding, 1em);
}
::slotted([slot="left"]) {
grid-column: 1;
grid-row: 1/5;
z-index: 10;
display: flex!important;
flex-direction: column;
}
::slotted([slot="right"]) {
grid-column: 3;
grid-row: 1/5;
z-index: 11;
display: flex!important;
flex-direction: column;
}
::slotted([slot="bottom"]) {
grid-row: 5;
grid-column: 1/4;
z-index: 12;
}
::slotted([slot="top"]) {
grid-row: 1;
grid-column: 1/4;
z-index: 13;
}
::slotted(:not([slot])) {
}
main {
flex-grow:1;
padding:var(--padding,1em);
grid-row: 3;
grid-column: 2;
}
</style>
<slot name="header"></slot>
<main><slot></slot></main>
<slot name="footer"></slot>
<slot name="left"></slot>
<slot name="right"></slot>
<slot name="top"></slot>
<slot name="bottom"></slot>
`;
    class App extends HTMLElement {
        constructor() {
            super();
            const shadow = this.attachShadow({ mode: 'open' });
            this.template = template.content.cloneNode(true);
            this.headerSlot = this.template.querySelector('slot[name=header]');
            this.footerSlot = this.template.querySelector('slot[name=footer]');
            this.leftPanelSlot = this.template.querySelector('slot[name=left]');
            this.rightPanelSlot = this.template.querySelector('slot[name=right]');
            this.topPanelSlot = this.template.querySelector('slot[name=top]');
            this.bottomPanelSlot = this.template.querySelector('slot[name=bottom]');
            shadow.appendChild(this.template);
        }
        static get observedAttributes() {
            return [];
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            this[property] = newValue;
        }
        connectedCallback() { }
        disconnectedCallback() { }
    }
    customElements.define('webui-app', App);
}
