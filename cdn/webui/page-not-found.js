/* Display page not found content */
{
    const template = `
<section class="paper elevation-10 side-by-side">
<section class="paper d-flex flex-column align-center justify-center readable-content">
<p>The page you are looking for was not found!</p>
</section>
<section class="paper image d-flex flex-column align-center justify-center readable-content">
<img src="https://cdn.myfi.ws/v/Vecteezy/404-error-illustration-exclusive-design-inspiration.svg" />
</section>
</section>
`;
    class OpenTemplate extends HTMLElement {
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
        connectedCallback() {
            if (!this.innerHTML) {
                this.innerHTML = template;
            }
        }
        disconnectedCallback() { }
    }
    customElements.define('webui-page-not-found', OpenTemplate);
}