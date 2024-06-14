/* Placeholder page content for pages under construction */
"use strict"
{
    class Content extends HTMLElement {
        constructor() {
            super();
        }
        static get observedAttributes() {
            return ['src'];
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            if (newValue === null || newValue === undefined) {
                delete this[property];
            } else {
                this[property] = newValue;
            }
        }
        async fetchContent() {
            if (!this.src) {
                setTimeout(() => this.fetchContent(), 10);
                return;
            }
            let content = await fetch(this.src);
            if (!content.ok) {
                this.innerHTML = `Failed to load content from ${this.src}`;
                return;
            }
            let body = await content.text();
            if (body.startsWith('<!DOCTYPE')) {
                this.innerHTML = `Source ${this.src} did not return expected markdown/html snippet (Full HTML documents are not allowed by this component)`;
            }
            let temp = document.createElement('div');
            temp.innerHTML = webuiApplyAppData(body);
            let t = this;
            temp.childNodes.forEach(node => {
                t.parentNode.insertBefore(node, t);
            });
            t.remove();
        }
        connectedCallback() {
            this.fetchContent();
        }
        disconnectedCallback() { }
    }
    customElements.define('webui-content', Content);
}
