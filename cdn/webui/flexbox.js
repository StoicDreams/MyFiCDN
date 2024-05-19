/* Flex container */
"use strict"
{
    const template = document.createElement('template')
    template.setAttribute('shadowrootmode', true);
    template.innerHTML = `
<style type="text/css">
:host {
display: flex!important;
}
</style>
<slot></slot>
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
            return ["gap", "grow", "column"];
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
            let a = this.attributes;
            if (!!a.grow) { styles.push('flex-grow:1'); }
            if (!!a.column) { styles.push('flex-direction:column'); }
            if (a.gap && a.gap.value) { styles.push(`gap:${getDim(this.attributes.gap.value)}`); }
            else { styles.push('gap:var(--flexgap,var(--padding,1em))'); }
            this._style.innerHTML = `:host{${styles.join(';')};}`;
        }
    }
    function getDim(value) {
        if (!value) return '';
        let num = parseFloat(value);
        if (num == value) return `${value}px`;
        return value;
    }
    customElements.define('webui-flexbox', FlexBox);
}
