/* Dynamically load font-awesome svg icons as requested */
"use strict"
{
    const template = document.createElement('template')
    template.setAttribute('shadowrootmode', true);
    template.innerHTML = `
<style type="text/css">
    :host {
        display: flex;
    }
</style>
`;
    class FlexBox extends HTMLElement {
        constructor() {
            super();
            const shadow = this.attachShadow({ mode: 'open' });
            this.template = template.content.cloneNode(true);
            this._style = this.template.querySelector('style');
            this.setStyles();
            shadow.appendChild(this.template);
        }
        static get observedAttributes() {
            return [];
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            this[property] = newValue;
            this.setStyles();
        }
        connectedCallback() { }
        disconnectedCallback() { }
        setStyles() {
            let styles = ["display:flex"];
            if (!!this.attributes.grow) { styles.push('flex-grow:1'); }
            if (!!this.attributes.column) { styles.push('flex-direction:column'); }
            this._style.innerHTML = `:host{${styles.join(';')};}`;
        }
    }
    customElements.define('webui-flexbox', FlexBox);
}
