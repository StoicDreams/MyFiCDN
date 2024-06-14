/* Display navigation link */
class NavLink extends HTMLElement {
    constructor() {
        super();
        const t = this;
        t._anchor = document.createElement('a');
        t._anchor.classList.add('navlink');
        t._display = document.createElement('span');
        t._anchor.appendChild(t._display);
    }
    static get observedAttributes() {
        return ['icon', 'family', 'name', 'url'];
    }
    attributeChangedCallback(property, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (newValue === null || newValue === undefined) {
            delete this[property];
        } else {
            this[property] = newValue;
        }
        switch (property) {
            case 'url':
                this._anchor.setAttribute('href', newValue);
                break;
            case 'name':
                this._display.innerHTML = newValue;
                this._anchor.setAttribute('title', this._display.innerText);
                break;
            case 'family':
                if (!this._icon) {
                    this._icon = document.createElement('webui-fa');
                    this._anchor.insertBefore(this._icon, this._display);
                }
                this._icon.setAttribute('family', newValue);
                break;
            case 'icon':
                if (!this._icon) {
                    this._icon = document.createElement('webui-fa');
                    this._anchor.insertBefore(this._icon, this._display);
                }
                this._icon.setAttribute('icon', newValue);
                break;
        }
    }
    connectedCallback() {
        if (!this.getAttribute('preload')) {
            this.setAttribute('preload', 'fa');
        }
        this.appendChild(this._anchor);
    }
    disconnectedCallback() { }
}
customElements.define('webui-nav-link', NavLink);