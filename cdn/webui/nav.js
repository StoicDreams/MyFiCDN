/* Display navigation links from a list */
"use strict"
{
    const template = document.createElement('template')
    template.setAttribute('shadowrootmode', true);
    template.innerHTML = `
<style type="text/css">
    :host {
        display: flex;
        flex-direction: column;
    }
</style>
<slot></slot>
`;
    class Nav extends HTMLElement {
        constructor() {
            super();
            const shadow = this.attachShadow({ mode: 'open' });
            this.template = template.content.cloneNode(true);
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
    customElements.define('webui-nav', Nav);
}
