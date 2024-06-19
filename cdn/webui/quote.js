/* Display themed quote */
{
    function toCamel(property) {
        return property.replace(/(-[A-Za-z0-9]{1})/g, a => { return a[1].toUpperCase(); });
    }
    class Quote extends HTMLElement {
        constructor() {
            super();
            const t = this;
        }
        static get observedAttributes() {
            return ['cite', 'theme', 'elevation'];
        }
        attributeChangedCallback(property, oldValue, newValue) {
            property = toCamel(property);
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
            if (t.elevation >= 0) {
                bc.classList.add(`elevation-${t.elevation}`);
            } else if (t.elevation < 0) {
                bc.classList.add(`elevation-n${t.elevation * -1}`);
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