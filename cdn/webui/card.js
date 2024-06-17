/* Display a single card component */
"use strict"
{
    const template = `<section style="max-width:500px;min-width:250px;" title="" class="paper card elevation-10"><section title="" class="paper card-header d-flex flex-row flex-gap align-center theme-tertiary"><section title="" class="paper avatar ml-1 pa-1"><img src="https://www.stoicdreams.com/Logo.svg" alt="" title=""></section><section title="" class="paper card-title d-flex flex-column flex-grow flex-gap"><h2 class="f3 pa-1 d-flex flex-wrap flex-row elevation-0">Stoic Dreams</h2></section><a href="https://www.stoicdreams.com" title="Stoic Dreams" target="_self" class="f3 pr-3"><webui-fa family="solid" icon="arrow-up-right-from-square"></webui-fa></a></section><section title="" class="paper card-body d-flex flex-column flex-gap pa-1"><div>The Stoic Dreams company portal.</div></section></section>
    `;
    class Card extends HTMLElement {
        constructor() {
            super();
            const t = this;
            t._content = document.createElement('section');
            let limit = 0;
            while (t.childNodes.length > 0 && ++limit < 100) {
                t._content.appendChild(t.childNodes[0]);
            }
            t._header = document.createElement('header');
            t.appendChild(t._header);
            t.appendChild(t._content);
        }
        static get observedAttributes() {
            return ['name', 'theme', 'width', 'avatar', 'link', 'elevation'];
        }
        buildComponent() {
            let t = this;
            t._header.className = `theme-${t.theme || 'primary'}`;
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
                    this.buildComponent();
                    break;
            }
        }
        connectedCallback() {
            this.classList.add('elevation-10');
        }
        disconnectedCallback() { }
    }
    customElements.define('webui-card', Card);
}