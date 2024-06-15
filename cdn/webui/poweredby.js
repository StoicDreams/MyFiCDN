/* Display multi-line, auto-resizing text input field. */
"use strict"
{
    const template = document.createElement('template')
    template.setAttribute('shadowrootmode', true);
    template.innerHTML = `
<style type="text/css">
::host {
}
a[href] {
color:inherit;
}
</style>
<div>
<sup>Powered by </sup>
<slot></slot>
</div>
`;
    class PoweredBy extends HTMLElement {
        constructor() {
            super();
            const shadow = this.attachShadow({ mode: 'open' });
            const t = this;
            t.template = template.content.cloneNode(true);
            t.anchor = document.createElement('a');
            t.anchor.setAttribute('href', 'https://webui.stoicdreams.com');
            t.anchor.innerHTML = 'Web UI';
            t.appendChild(t.anchor);
            shadow.appendChild(t.template);
        }
        static get observedAttributes() {
            return ['version'];
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            if (newValue === null || newValue === undefined) {
                delete this[property];
            } else {
                this[property] = newValue;
            }
            switch (property) {
                case 'version':
                    this.anchor.setAttribute('title', `Web UI version ${newValue}`);
                    break;
            }
        }
        connectedCallback() {
            if (!this.version) {
                this.setAttribute("version", "0.10.5");
            }
        }
        disconnectedCallback() { }
    }
    customElements.define('webui-poweredby', PoweredBy);
}
