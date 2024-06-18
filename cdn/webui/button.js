/* Button Component */
"use strict"
{
    const template = document.createElement('template')
    template.setAttribute('shadowrootmode', true);
    template.innerHTML = `
<style type="text/css">
:host {
display: inline-flex;
flex-flow: row;
gap: 0.5em;
align-items: center;
text-decoration: none;
padding: calc(1 * var(--padding)) calc(2 * var(--padding));
border-radius: var(--corners);
min-height: 2em;
-webkit-user-select: text;
user-select: text;
background-color: var(--color-button);
color: var(--color-button-offset);
}
:host([href]:not(:disabled)),
:host([data-trigger]:not(:disabled)),
:host([onclick]:not(:disabled)) {
cursor:pointer;
}
</style>
<slot name="start-icon"></slot>
<slot></slot>
<slot name="end-icon"></slot>
    `;
    class Button extends HTMLElement {
        constructor() {
            super();
            const t = this;
            const shadow = t.attachShadow({ mode: 'open' });
            t.template = template.content.cloneNode(true);
            shadow.appendChild(t.template);
            t._startIcon = t.template.querySelector('slot[name="start-icon"]');
            t._endIcon = t.template.querySelector('slot[name="end-icon"]');
        }
        static get observedAttributes() {
            return ['href', 'theme', 'start-icon', 'end-icon', 'start-icon-family', 'end-icon-family', 'start-icon-class', 'end-icon-class'];
        }

        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            if (newValue === null || newValue === undefined) {
                delete this[property];
            } else {
                this[property] = newValue;
            }
            let t = this;
            switch (property) {
                case 'theme':
                    let r = [];
                    t.classList.forEach(c => {
                        if (c.startsWith('theme-')) {
                            r.push(c);
                        }
                    });
                    r.forEach(c => t.classList.remove(c));
                    t.classList.add(`theme-${newValue}`);
                    break;
                case 'start-icon-family':
                case 'start-icon-class':
                case 'start-icon':
                    {
                        t.querySelectorAll('[slot="start-icon"]').forEach(n => n.remove());
                        if (!t['start-icon']) break;
                        let ico = document.createElement('webui-fa');
                        ico.setAttribute('slot', 'start-icon');
                        ico.setAttribute('icon', t['start-icon']);
                        if (t['start-icon-family']) {
                            ico.setAttribute('family', t['start-icon-family']);
                        }
                        if (t['start-icon-class']) {
                            ico.className = t['start-icon-class'];
                        }
                        t.appendChild(ico);
                    }
                    break;
                case 'end-icon-family':
                case 'end-icon-class':
                case 'end-icon':
                    {
                        t.querySelectorAll('[slot="end-icon"]').forEach(n => n.remove());
                        if (!t['end-icon']) break;
                        let ico = document.createElement('webui-fa');
                        ico.setAttribute('slot', 'end-icon');
                        ico.setAttribute('icon', t['end-icon']);
                        if (t['end-icon-family']) {
                            ico.setAttribute('family', t['end-icon-family']);
                        }
                        if (t['end-icon-class']) {
                            ico.className = t['end-icon-class'];
                        }
                        t.appendChild(ico);
                    }
                    break;

            }
        }
        connectedCallback() { }
        disconnectedCallback() { }
    }
    customElements.define('webui-button', Button);
}