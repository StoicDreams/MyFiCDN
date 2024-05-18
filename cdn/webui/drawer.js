/* Drawer */
"use strict"
{
    const template = document.createElement('template')
    template.setAttribute('shadowrootmode', true);
    template.innerHTML = `
<style type="text/css">
    :host {
        display: flex;
        flex-direction: column;
        overflow: auto;
        background-color:red;
        z-index:100;
    }
    :host([fixed]) {
        position: fixed;
        left: 0;
        top: 0;
        width: fit-content;
        height: 100%;
    }
    :host([fixed][slot="top"]) {
        width: 100%;
        height: fit-content;
    }
    :host([fixed][slot="right"]) {
        left: auto;
        right: 0;
    }
    :host([fixed][slot="bottom"]) {
        top: auto;
        bottom: 0;
        width: 100%;
        height: fix-content;
    }
    :host([slot="left"]) {
        background-color: purple;
    }
    ::slotted([slot="header"]) {
        display: flex!important;
        font-size: 1.2rem;
        gap:var(--padding, 1em);
        padding:var(--padding,1em);
    }
    ::slotted([slot="footer"]) {
        display: flex!important;
        gap:var(--padding, 1em);
        padding:var(--padding,1em);
    }
    .footer {
        padding: var(--padding, 1em);
    }
</style>
<slot name="header"></slot>
<slot></slot>
<webui-flexbox grow></webui-flexbox>
<section class="footer">
    <slot name="footer"></slot>
</section>
`;
    class Drawer extends HTMLElement {
        constructor() {
            super();
            const shadow = this.attachShadow({ mode: 'open' });
            this.template = template.content.cloneNode(true);
            this.headerSlot = this.template.querySelector('slot[name=header]');
            this.footerSlot = this.template.querySelector('slot[name=footer]');
            shadow.appendChild(this.template);
        }
        static get observedAttributes() {
            return ["position"];
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            this[property] = newValue;
        }
        connectedCallback() { }
        disconnectedCallback() { }
    }
    customElements.define('webui-drawer', Drawer);
}
