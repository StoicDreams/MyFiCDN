/* Display group of navigation links */
class NavGroup extends HTMLElement {
    constructor() {
        super();
        const t = this;
        t._anchor = document.createElement('a');
        t._anchor.classList.add('navlink');
        t._display = document.createElement('span');
        t._anchor.appendChild(t._display);
        t._caret = document.createElement('webui-fa');
        t._caret.setAttribute('icon', 'caret-down');
        t._caret.setAttribute('family', 'solid');
        t._anchor.appendChild(t._caret);
        t._anchor.addEventListener('click', _ev => {
            t.open = !t.open;
            t._caret.setAttribute('icon', t.open ? 'caret-up' : 'caret-down');
            if (t.open) {
                t._anchor.classList.add('show');
            } else {
                t._anchor.classList.remove('show');
            }
        });
    }
    static get observedAttributes() {
        return ['icon', 'family', 'name'];
    }
    attributeChangedCallback(property, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (newValue === null || newValue === undefined) {
            delete this[property];
        } else {
            this[property] = newValue;
        }
        switch (property) {
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
        if (this.childNodes[0]) {
            this.insertBefore(this._anchor, this.childNodes[0]);
        } else {
            this.appendChild(this._anchor);
        }
    }
    disconnectedCallback() { }
}
customElements.define('webui-nav-group', NavGroup);