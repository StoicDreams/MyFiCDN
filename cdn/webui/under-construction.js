/* Placeholder page content for pages under construction */
"use strict"
{
    class UnderConstruction extends HTMLElement {
        constructor() {
            super();
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
            let container = document.createElement('webui-sideimage');
            container.setAttribute('src', 'https://cdn.myfi.ws/v/Vecteezy/people-are-building-a-spaceship-rocket-cohesive-teamwork-in.svg');
            container.innerHTML = webuiApplyAppData(`
<webui-flex column data-subscribe="under-construction" data-set="innerHTML">

<p>{APP_NAME} <span data-subscribe="domain"></span> is under construction.</p>

</webui-flex>
`);
            this.parentNode.insertBefore(container, this);
            this.remove();
        }
        disconnectedCallback() { }
    }
    customElements.define('webui-under-construction', UnderConstruction);
}
