/* Component for displaying user storage consent */
{
    class MyfiStorageConsent extends HTMLElement {
        constructor() {
            super();
            const t = this;
        }
        static get observedAttributes() {
            return [];
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            if (newValue === null || newValue === undefined) {
                delete this[property];
            } else {
                this[property] = newValue;
            }
        }
        connectedCallback() { }
        disconnectedCallback() { }
    }
    customElements.define('webui-myfi-storage-consent', MyfiStorageConsent);
}