/* Component used for posting data to app from loaded html */
{
    class Data extends HTMLElement {
        constructor() {
            super();
            const t = this;
            Object.keys(t.dataset).forEach(key => {
                webuiSetData(key, t.dataset[key]);
            });
            t.remove();
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
    customElements.define('webui-data', Data);
}
