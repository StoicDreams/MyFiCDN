/* Wrapper element for application */
"use strict"
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
    document.body.addEventListener('input', handleDataTrigger);
    document.body.addEventListener('change', handleDataTrigger);
    const template = document.createElement('template')
    template.setAttribute('shadowrootmode', true);
    template.innerHTML = `
<style type="text/css">
    :host {
        display: grid;
        grid-template-columns: min-content auto min-content;
        grid-template-rows: min-content auto min-content;
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
    }
    ::slotted([slot="header"]),
    header::slotted([slot="header"]) {
        grid-row: 1;
        grid-column: 2;
        display: flex!important;
        align-items: start;
        justify-items: start;
        font-size: 1.2rem;
        gap:var(--padding, 1em);
        padding:var(--padding,1em);
    }
    ::slotted([slot="footer"]) {
        grid-row: 3;
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
        grid-row: 1/4;
        z-index: 10;
        display: flex!important;
        flex-direction: column;
    }
    ::slotted([slot="right"]) {
        grid-column: 3;
        grid-row: 1/4;
        z-index: 11;
        display: flex!important;
        flex-direction: column;
    }
    ::slotted([slot="bottom"]) {
        grid-row: 3;
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
        grid-row: 2;
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
