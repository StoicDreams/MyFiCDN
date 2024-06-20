/* Display paper element. */
"use strict"
{
    function toCamel(property) {
        return property.replace(/(-[A-Za-z0-9]{1})/g, a => { return a[1].toUpperCase(); });
    }
    class Paper extends HTMLElement {
        constructor() {
            super();
            const t = this;
            if (t.parentNode.nodeName === 'P') {
                let p = t.parentNode;
                t.parentNode.parentNode.insertBefore(t, t.parentNode);
                if (p.innerHTML.trim() === '') {
                    p.remove();
                }
            }
        }
        static get observedAttributes() {
            return ['elevation', 'theme'];
        }
        removeClassPrefix(prefix) {
            let r = [];
            this.classList.forEach(c => {
                if (c.startsWith(prefix)) { r.push(c); }
            });
            r.forEach(c => this.classList.remove(c));
        }
        attributeChangedCallback(property, oldValue, newValue) {
            property = toCamel(property);
            if (oldValue === newValue) return;
            if (newValue === null || newValue === undefined) {
                delete this[property];
            } else {
                this[property] = newValue;
            }
            switch (property) {
                case 'elevation':
                    let v = parseInt(newValue);
                    this.removeClassPrefix('elevation-');
                    if (v > 0) {
                        this.classList.add(`elevation-${v}`);
                    } else if (v < 0) {
                        this.classList.add(`elevation-n${v * -1}`);
                    }
                    break;
                case 'theme':
                    this.removeClassPrefix('theme-');
                    this.classList.add(`theme-${newValue}`);
                    break;
            }
        }
        connectedCallback() {
        }
        disconnectedCallback() { }
    }
    customElements.define('webui-paper', Paper);
}
