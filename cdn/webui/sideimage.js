/* Display side-by-side content where one side is an image */
"use strict"
{
    class SideImage extends HTMLElement {
        constructor() {
            super();
        }
        static get observedAttributes() {
            return ['elevation', 'reverse'];
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
                case 'reverse':
                    console.log('reverse', newValue);
                    if (newValue) {
                        this.classList.remove('auto-maxcontent');
                        this.classList.add('maxcontent-auto');
                    } else {
                        this.classList.remove('maxcontent-auto');
                        this.classList.add('auto-maxcontent');
                    }
                    break;
            }
        }
        connectedCallback() {
            this.classList.add('auto-maxcontent');
        }
        disconnectedCallback() { }
    }
    customElements.define('webui-sideimage', SideImage);
}
