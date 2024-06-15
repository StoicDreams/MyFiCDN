/* Display themed quote */
{
    class Quote extends HTMLElement {
        constructor() {
            super();
            const t = this;
        }
        static get observedAttributes() {
            return ['cite', 'theme'];
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            if (newValue === null || newValue === undefined) {
                delete this[property];
            } else {
                this[property] = newValue;
            }
        }
        connectedCallback() {
            let t = this;
            let bc = document.createElement('blockquote');
            let r = [];
            t.parentNode.insertBefore(bc, t);
            t.childNodes.forEach(n => r.push(n));
            r.forEach(n => bc.appendChild(n));
            bc.classList.add('quote');
            if (t.theme) {
                bc.classList.add(`highlight-theme-${t.theme}`);
            }
            if (t.cite) {
                let c = document.createElement('cite');
                c.innerHTML = t.cite;
                bc.appendChild(c);
            }
            t.remove();
        }
        disconnectedCallback() { }
    }
    customElements.define('webui-quote', Quote);
}