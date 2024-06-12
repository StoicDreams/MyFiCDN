/* Toggle button that switches icons, title */
"use strict"
{
    const template = document.createElement('template')
    template.setAttribute('shadowrootmode', true);
    template.innerHTML = `
<style type="text/css">
:host {
}
button {
    background-color:transparent;
    border:none;
    box-shadow:none;
    color:inherit;
    margin:0;
    padding:0;
}
</style>
<button><webui-fa></webui-fa></button>
`;
    class ToggleIcon extends HTMLElement {
        constructor() {
            super();
            const shadow = this.attachShadow({ mode: 'open' });
            this.template = template.content.cloneNode(true);
            this.button = this.template.querySelector('button');
            this.icon = this.button.querySelector('webui-fa');
            shadow.appendChild(this.template);
            this.updateElements();
            this.addEventListener('click', ev => {
                if (!this.dataset || !this.dataset.enabled) {
                    this.enabled = !this.enabled;
                    if (this.enabled) {
                        this.removeAttribute('enabled');
                    } else {
                        this.setAttribute('enabled', true);
                    }
                }
                setTimeout(() => { this.updateElements() }, 10);
            });
        }
        static get observedAttributes() {
            return ["title", "title-on", "title-off", "icon", "icon-on", "icon-off", "icon-family", "icon-family-on", "icon-family-off", "data-enabled", "enabled"];
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            if (newValue === null || newValue === undefined) {
                delete this[property];
            } else {
                this[property] = newValue;
            }
            this.updateElements();
        }
        connectedCallback() { }
        disconnectedCallback() { }
        getIconOn() { return this['icon-on'] || this['icon'] || 'toggle-on'; }
        getIconOff() { return this['icon-off'] || this['icon'] || 'toggle-off'; }
        getIconFamilyOn() { return this['icon-family-on'] || this['icon-family'] || 'regular'; }
        getIconFamilyOff() { return this['icon-family-off'] || this['icon-family'] || 'regular'; }
        getTitleOn() { return this['title-on'] || this['title'] || null; }
        getTitleOff() { return this['title-off'] || this['title'] || null; }
        updateElements() {
            if (this.dataset.enabled) {
                this.enabled = !!document.querySelector(this.dataset.enabled);
            }
            this.icon.setAttribute('icon', this.enabled ? this.getIconOn() : this.getIconOff());
            this.icon.setAttribute('family', this.enabled ? this.getIconFamilyOn() : this.getIconFamilyOff());
            let title = this.enabled ? this.getTitleOn() : this.getTitleOff();
            if (title) {
                this.setAttribute('title', title);
            }
        }
    }
    customElements.define('webui-toggle-icon', ToggleIcon);
}
