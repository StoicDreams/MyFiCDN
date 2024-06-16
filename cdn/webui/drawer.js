/* Drawer */
"use strict"
{
    const template = document.createElement('template')
    template.setAttribute('shadowrootmode', true);
    template.innerHTML = `
<style type="text/css">
:host {
background-color: var(--site-background-color, white);
color: var(--site-background-offset, black);
display: flex;
flex-direction: column;
overflow: auto;
z-index:100;
}
:host([id]) {
transition: all 400ms;
}
:host([slot="bottom"]),
:host([slot="top"]){
flex-direction: row;
}
:host(:not([docked])) {
position: fixed;
left: 0;
top: 0;
width: fit-content;
height: 100%;
transform: translate(-105%, 0);
}
:host(:not([docked]).open) {
transform: translate(0,0);
}
:host(:not([docked])[slot="top"]) {
width: 100%;
height: fit-content;
}
:host(:not([docked])[slot="top"]:not(.open)) {
transform: translate(0,-105%);
}
:host(:not([docked])[slot="right"]) {
left: auto;
right: 0;
}
:host(:not([docked])[slot="right"]:not(.open)) {
transform: translate(105%,0);
}
:host(:not([docked])[slot="bottom"]) {
top: auto;
bottom: 0;
width: 100%;
height: fit-content;
}
:host(:not([docked])[slot="bottom"]:not(.open)) {
transform: translate(0,105%);
}
:host[docked]{
}
:host([slot="left"]) {
}
::slotted([slot="header"]) {
display: flex!important;
font-size: 1.2rem;
gap:var(--padding, 1em);
padding:var(--padding,1em);
}
::slotted([slot="footer"]) {
display: flex!important;
gap:var(--padding, 1em);
padding:var(--padding,1em);
}
slot:not([name]) {
display:block;
flex-grow:1;
}
.footer {
padding: var(--padding, 1em);
}
#actions:empty {display:none;}
button {
background:none;
color:inherit;
padding:--padding);
border:none;
cursor:pointer;
}
</style>
<slot name="header"></slot>
<slot></slot>
<slot name="footer"></slot>
`;
    const dockableTemplate = `
<webui-toggle-icon data-toggleattr="[ID]|docked" data-enabled="[ID][docked]" icon-on="send-backward" icon-off="bring-forward" title-on="Hide Navigation" title-off="Dock Navigation"></webui-toggle-icon>`;
    const moveableTempalte = `
<button data-setattr="[ID]|slot|left" title="Set navigation to left" class="toggle-pos-left">
<webui-fa icon="sidebar" family="regular"></webui-fa>
</button>
<button data-setattr="[ID]|slot|right" title="Set navigation to right" class="toggle-pos-right">
<webui-fa icon="sidebar-flip" family="regular"></webui-fa>
</button>
<button data-setattr="[ID]|slot|top" title="Set navigation to top" class="toggle-pos-top">
<webui-fa icon="window" family="regular"></webui-fa>
</button>
<button data-setattr="[ID]|slot|bottom" title="Set navigation to bottom" class="toggle-pos-bottom">
<webui-fa icon="window-flip" family="regular" class="fa-rotate-180"></webui-fa>
</button>`;
    class Drawer extends HTMLElement {
        constructor() {
            super();
            let t = this;
            t._id = `d${crypto.randomUUID()}`.split('-').join('');
            t._idselector = `#${t._id}`;
            const shadow = t.attachShadow({ mode: 'open' });
            t.template = template.content.cloneNode(true);
            t.headerSlot = t.template.querySelector('slot[name=header]');
            t.footerSlot = t.template.querySelector('slot[name=footer]');
            shadow.appendChild(t.template);
            let cache = t.innerHTML;
            const startObserving = (domNode) => {
                const observer = new MutationObserver(mutations => {
                    mutations.forEach(function (mutation) {
                        if (cache !== t.innerHTML) {
                            cache = t.innerHTML;
                            t.buildFooterContent();
                        }
                    });
                });
                observer.observe(domNode, {
                    childList: true,
                    attributes: false,
                    characterData: false,
                    subtree: true,
                });
                return observer;
            };
            startObserving(t);
        }
        static get observedAttributes() {
            return ["position", "docked", "data-dockable", "data-moveable"];
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            if (newValue === null || newValue === undefined) {
                delete this[property];
            } else {
                this[property] = newValue;
            }
            switch (property) {
                case 'data-dockable':
                    this[property] = true;
                    this.buildFooterContent();
                    break;
                case 'data-moveable':
                    this[property] = true;
                    this.buildFooterContent();
                    break;
            }
        }
        buildFooterContent() {
            this.querySelectorAll('[slot="footer"]').forEach(el => el.remove());
            let content = '';
            let fb = document.createElement('webui-flex');
            fb.setAttribute('justify', 'center');
            fb.setAttribute('slot', 'footer');
            if (this['data-moveable']) { content += moveableTempalte.split('[ID]').join(this._idselector); }
            if (this['data-dockable']) { content += dockableTemplate.split('[ID]').join(this._idselector); }
            fb.innerHTML = content;
            this.appendChild(fb);
        }
        connectedCallback() {
            let t = this;
            if (!t.getAttribute('preload')) {
                t.setAttribute('preload', 'fa flex toggle-icon');
            }
            // delay setting id, which enables transitions, to avoid undocked drawers from displaying on page load.
            setTimeout(() => {
                t.setAttribute('id', t._id);
            }, 100);
        }
        disconnectedCallback() { }
    }
    customElements.define('webui-drawer', Drawer);
}
