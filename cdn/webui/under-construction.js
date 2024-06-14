/* Placeholder page content for pages under construction */
"use strict"
{
    class UnderConstruction extends HTMLElement {
        constructor() {
            super();
            let container = document.createElement('webui-sideimage');
            container.setAttribute('src', 'https://cdn.myfi.ws/v/Vecteezy/people-are-building-a-spaceship-rocket-cohesive-teamwork-in.svg');
            container.innerHTML = `<p>This website <span data-subscribe="domain"></span> is under construction.</p>`;
            this.parentNode.insertBefore(this, container);
            this.remove();
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
            this.classList.add('auto-maxcontent');
        }
        disconnectedCallback() { }
    }
    customElements.define('webui-under-construction', UnderConstruction);
}
