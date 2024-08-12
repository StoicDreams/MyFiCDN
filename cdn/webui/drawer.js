/* Drawer */
"use strict"
{
    const dockableTemplate = `
<webui-toggle-icon class="pa-0" data-toggleattr="[ID]|docked" data-enabled="[ID]" icon-on="stacked-squares" icon-off="stacked-squares" title-on="Hide Navigation" flags-on="fill" flags-off="" title-off="Dock Navigation"></webui-toggle-icon>`;
    const moveableTemplate = `
<button data-setattr="[ID]|slot|left" aria-label="Set navigation to left" class="toggle-pos-left">
<webui-icon icon="drawer|rotate:90"></webui-icon>
</button>
<button data-setattr="[ID]|slot|right" aria-label="Set navigation to right" class="toggle-pos-right">
<webui-icon icon="drawer|rotate:-90"></webui-icon>
</button>
<button data-setattr="[ID]|slot|top" aria-label="Set navigation to top" class="toggle-pos-top">
<webui-icon icon="drawer|rotate:180"></webui-icon>
</button>
<button data-setattr="[ID]|slot|bottom" aria-label="Set navigation to bottom" class="toggle-pos-bottom">
<webui-icon icon="drawer"></webui-icon>
</button>`;
    webui.define("webui-drawer", {
        preload: 'icon flex toggle-icon',
        constructor: (t) => {
            t._idselector = `#${t._id}`;
            t.headerSlot = t.template.querySelector('slot[name=header]');
            t.footerSlot = t.template.querySelector('slot[name=footer]');
            let cache = t.innerHTML;
            const startObserving = (domNode) => {
                const observer = new MutationObserver(mutations => {
                    mutations.forEach(function (_m) {
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
        },
        connected: (t) => {
            // delay setting id, which enables transitions, to avoid undocked drawers from displaying on page load.
            setTimeout(() => {
                t.setAttribute('id', t._id);
            }, 100);
        },
        attr: ['position', 'docked', 'data-dockable', 'data-moveable'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'dataDockable':
                    t.dataDockable = true;
                    t.buildFooterContent();
                    break;
                case 'dataMoveable':
                    t.dataMoveable = true;
                    t.buildFooterContent();
                    break;
            }
        },
        buildFooterContent: function () {
            this.querySelectorAll('[slot="footer"]').forEach(el => el.remove());
            let content = '';
            let fb = document.createElement('webui-flex');
            fb.setAttribute('justify', 'center');
            fb.setAttribute('slot', 'footer');
            if (this.dataMoveable) { content += moveableTemplate.split('[ID]').join(this._idselector); }
            if (this.dataDockable) { content += dockableTemplate.split('[ID]').join(this._idselector); }
            fb.innerHTML = content;
            this.appendChild(fb);
        },
        shadowTemplate: `
<slot name="header"></slot>
<slot></slot>
<slot name="footer"></slot>
<style type="text/css">
:host {
background-color: var(--theme-color, var(--color-background, white));
color: var(--theme-color-offset, var(--color-background-offset, black));
display: flex;
flex-direction: column;
overflow: auto;
z-index:100;
}
:host([id]) {
transition: all 400ms;
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
:host([slot="left"]),
:host([slot="left"]) {
min-width: 15ch;
}
::slotted([slot="header"]) {
display: flex;
font-size: 1.2rem;
gap:var(--padding, 1em);
padding:var(--padding,1em);
}
::slotted([slot="footer"]) {
display: flex;
gap:var(--padding, 1em);
padding:var(--padding,1em);
--theme-color: var(--color-footer);
--theme-color-offset: var(--color-footer-offset);
background-color:var(--theme-color);
color:var(--theme-color-offset);
}
slot:not([name]) {
display:block;
flex-grow:1;
}
#actions:empty {display:none;}
button {
background:none;
color:inherit;
padding:--padding);
border:none;
cursor:pointer;
}
:host([slot="bottom"]),
:host([slot="top"]){
flex-direction:row;
align-items:center;
}
:host([slot="bottom"]) ::slotted([slot="header"]),
:host([slot="top"]) ::slotted([slot="header"]) {
min-width:3rem;
}
:host([slot="bottom"]) ::slotted(:not([name])),
:host([slot="top"]) ::slotted(:not([name])) {
position:relative;
}
:host([slot="bottom"]) ::slotted([slot="footer"]),
:host([slot="top"]) ::slotted([slot="footer"]) {
min-width:8rem;
}
</style>
`
    });
}
