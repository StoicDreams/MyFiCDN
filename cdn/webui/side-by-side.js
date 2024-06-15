/* Display side-by-side content */
"use strict"
{
    class SideBySide extends HTMLElement {
        constructor() {
            super();
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
        connectedCallback() {
        }
        disconnectedCallback() { }
    }
    customElements.define('webui-side-by-side', SideBySide);
}
