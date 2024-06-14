/* Display navigation links from a list */
"use strict"
{
    class Nav extends HTMLElement {
        constructor() {
            super();
        }
        static get observedAttributes() {
            return ['routes', 'nav-routes'];
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            if (newValue === null || newValue === undefined) {
                delete this[property];
            } else {
                this[property] = newValue;
            }
            switch (property) {
                case 'routes':
                    this.loadRoutes(newValue);
                    break;
                case 'nav-routes':
                    this.buildNav(newValue);
                    break;
            }
        }
        async loadRoutes(url) {
            if (!url) return;
            let loaded = await fetch(url);
            if (!loaded.ok) return;
            let data = await loaded.text();
            this.buildNav(data);
        }
        buildLink(parent, link) {
            let t = this;
            let el = null;
            if (link.url) {
                el = document.createElement('webui-nav-link');
                el.setAttribute('url', link.url);
            } else if (link.children) {
                el = document.createElement('webui-nav-group');
                link.children.forEach(child => {
                    t.buildLink(el, child);
                });
            } else {
                console.error('Invalid nav item', link);
                return;
            }
            if (link.icon) {
                el.setAttribute('icon', link.icon);
                if (link.iconFamily) {
                    el.setAttribute('family', link.iconFamily);
                }
            }
            el.setAttribute('name', link.name);
            parent.appendChild(el);
        }
        buildNav(navJson) {
            if (!navJson) return;
            let nav = JSON.parse(navJson);
            let t = this;
            t.innerHTML = '';
            nav.forEach(link => {
                this.buildLink(t, link);
            });
        }
        connectedCallback() {
            if (!this.getAttribute('preload')) {
                this.setAttribute('preload', 'fa paper nav-group nav-link');
            }
        }
        disconnectedCallback() { }
    }
    customElements.define('webui-nav', Nav);
}
