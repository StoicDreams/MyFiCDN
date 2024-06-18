/* Display a single card component */
"use strict"
{
    const template = document.createElement('template')
    template.setAttribute('shadowrootmode', true);
    template.innerHTML = `
<style type="text/css">
:host {
}
slot:not([name]) {
    display:flex;
    flex-direction:column;
    grid-gap:var(--padding);
    padding:var(--padding);
}
</style>
<slot name="header"></slot>
<slot></slot>
`;
    class Card extends HTMLElement {
        constructor() {
            super();
            const t = this;
            const shadow = t.attachShadow({ mode: 'open' });
            t.template = template.content.cloneNode(true);
            shadow.appendChild(t.template);
        }
        static get observedAttributes() {
            return ['name', 'theme', 'width', 'avatar', 'link', 'elevation'];
        }
        buildHeader() {
            let t = this;
            if (!t._header) {
                t._header = t.querySelector('slot[name="header"]');
                if (!t._header) {
                    t._header = document.createElement('header');
                    t._header.setAttribute('slot', 'header');
                }
            }

            t._header.className = `theme-${t.theme || 'title'}`;
            t._header.innerHTML = '';
            if (t.avatar) {
                let a = document.createElement('webui-avatar');
                a.setAttribute('src', t.avatar);
                t._header.appendChild(a);
            }
            if (t.width) {
                t.style.maxWidth = `${t.width}px`;
                t.style.minWidth = `${(t.width * 0.7)}px`;
            }
            let n = document.createElement('section');
            n.classList.add('flex-grow');
            t._header.appendChild(n);
            n.innerHTML = `${t.name || ''}`;
            if (t.link) {
                let l = document.createElement('a');
                l.setAttribute('href', t.link);
                t._header.appendChild(l);
                let li = document.createElement('webui-fa');
                l.appendChild(li);
                li.setAttribute('icon', 'arrow-up-right-from-square');
            }
            // JS Bug? Timeout needed or else header does not show up when loading after page navigation.
            setTimeout(() => {
                t.appendChild(t._header);
            }, 1);
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            if (newValue === null || newValue === undefined) {
                delete this[property];
            } else {
                this[property] = newValue;
            }
            switch (property) {
                case 'elevation':
                    this.classList.remove('elevation-10');
                    this.classList.add(`elevation-${newValue}`);
                    break;
                default:
                    this.buildHeader();
                    break;
            }
        }
        connectedCallback() {
            this.classList.add('elevation-10');
        }
        disconnectedCallback() {
            let t = this;
            t.innerHTML = '';
            if (t._header) {
                this._header.remove();
            }
            this.remove();
        }
    }
    customElements.define('webui-card', Card);
}