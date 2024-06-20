/* Display button for opening MyFi Account Info panel. */
"use strict"
{
    class MyfiInfo extends HTMLElement {
        constructor() {
            super();
            const t = this;
            if (t.parentNode.nodeName === 'P') {
                let p = t.parentNode;
                t.parentNode.parentNode.insertBefore(t, t.parentNode);
                if (p.innerHTML.trim() === '') {
                    p.remove();
                }
            }
        }
        static get observedAttributes() {
            return [];
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            if (newValue === null || newValue === undefined) {
                delete this[property];
            } else {
                this[property] = newValue;
            }
        }
        connectedCallback() { }
        disconnectedCallback() { }
    }
    customElements.define('webui-myfi-info', MyfiInfo);
}
