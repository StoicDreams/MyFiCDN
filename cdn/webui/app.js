/* Dynamically load font-awesome svg icons as requested */
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
        display: flex;
        flex-direction: column;
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
    }
    ::slotted([slot="header"]) {
        display: flex!important;
        font-size: 1.2rem;
        gap:var(--padding, 1em);
        padding:var(--padding,1em);
    }
    ::slotted([slot="footer"]) {
        display: flex!important;
        font-size: 0.8rem;
        align-items:center;
        padding:var(--padding, 1em);
        vertical-align:middle;
        gap:var(--padding, 1em);
    }
    ::slotted([slot="left-panel"]) {
        display: flex!important;
        flex-direction: column;
    }
    ::slotted([slot="right-panel"]) {
        display: flex!important;
        flex-direction: column;
    }
    ::slotted(:not([slot])) {
    }
    main {
        flex-grow:1;
        padding:var(--padding,1em);
    }
</style>
<slot name="header"></slot>
<main><slot></slot></main>
<slot name="footer"></slot>
<slot name="left-panel"></slot>
<slot name="right-panel"></slot>
<slot name="top-panel"></slot>
<slot name="bottom-panel"></slot>
`;
    class App extends HTMLElement {
        constructor() {
            super();
            const shadow = this.attachShadow({ mode: 'open' });
            this.template = template.content.cloneNode(true);
            this.headerSlot = this.template.querySelector('slot[name=header]');
            this.footerSlot = this.template.querySelector('slot[name=footer]');
            this.leftPanelSlot = this.template.querySelector('slot[name=left-panel]');
            this.rightPanelSlot = this.template.querySelector('slot[name=right-panel]');
            this.topPanelSlot = this.template.querySelector('slot[name=top-panel]');
            this.bottomPanelSlot = this.template.querySelector('slot[name=bottom-panel]');
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
