/* Display a card component wrapper */
"use strict"
{
    class Cards extends HTMLElement {
        constructor() {
            super();
            const t = this;
        }
        static get observedAttributes() {
            return ['elevation'];
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            if (newValue === null || newValue === undefined) {
                delete this[property];
            } else {
                this[property] = newValue;
            }
            switch (property) {
                case 'elevation':
                    this.classList.add(`elevation-${newValue}`);
                    break;
            }
        }
        connectedCallback() {
        }
        disconnectedCallback() { }
    }
    customElements.define('webui-cards', Cards);
}