/* Display an avatar component */
"use strict"
{
    const template = document.createElement('template')
    template.setAttribute('shadowrootmode', true);
    template.innerHTML = `
<style type="text/css">
:host {
display:inline-flex;
justify-content:center;
align-items:center;
margin:var(--padding);
}
slot {
font-size: 1.2em;
}
slot>img,
slot>svg {
height:1em;
}

</style>
<slot></slot>
`;
    class Avatar extends HTMLElement {
        constructor() {
            super();
            const t = this;
            const shadow = t.attachShadow({ mode: 'open' });
            t.template = template.content.cloneNode(true);
            t._slot = t.template.querySelector('slot');
            shadow.appendChild(t.template);
        }
        static get observedAttributes() {
            return ['src', 'theme'];
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            let t = this;
            if (newValue === null || newValue === undefined) {
                delete t[property];
            } else {
                t[property] = newValue;
            }
            switch (property) {
                case 'src':
                    if (!newValue) {
                        t._slot.innerHTML = '';
                        return;
                    }
                    if (newValue.startsWith('<svg')) {
                        t._slot.innerHTML = newValue;
                        return;
                    }

                    if (newValue.indexOf(' ') !== -1) {
                        let fi = newValue.split(' ');
                        if (fi.length !== 2) { return; }
                        let fam = fi[0];
                        let ico = fi[1];
                        if (['brands', 'solid', 'regular', 'thin', 'duotone'].indexOf(fam) === -1) {
                            fam = fi[1];
                            ico = fi[0];
                        }
                        t._slot.innerHTML = `<webui-fa icon="${ico}" family="${fam}"></webui-fa>`;
                        return;
                    }
                    if (newValue.length < 3) {
                        t._slot.innerHTML = newValue;
                        return;
                    }
                    t._slot.innerHTML = `<img src="${newValue}" />`;
                    console.log('slot', t._slot);
                    break;
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
            }
        }
        connectedCallback() {
        }
        disconnectedCallback() { }
    }
    customElements.define('webui-avatar', Avatar);
}