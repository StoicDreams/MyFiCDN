/* Display paper element. */
"use strict"
{
    class Paper extends HTMLElement {
        constructor() {
            super();
            const t = this;
            t.classList.add('paper');
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
                    let v = parseInt(newValue);
                    if (v > 0) {
                        this.classList.add(`elevation-${v}`);
                    } else if (v < 0) {
                        this.classList.add(`elevation-n${v * -1}`);
                    }
                    break;
            }
        }
        connectedCallback() { }
        disconnectedCallback() { }
    }
    customElements.define('webui-paper', Paper);
}
