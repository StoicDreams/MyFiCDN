/*!
 * Web UI Drawer - https://webui.stoicdreams.com/components#webui-drawer
 * A component for displaying and managing a drawer within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    const dockableTemplate = `
<webui-toggle-icon class="pa-0" data-toggleattr="[ID]|docked" data-enabled="[ID]" icon-on="arrow-side-from-square|rotate:180" icon-off="drawer|rotate:90" title-on="Hide [NAME]" flags-on="" flags-off="fill" title-off="Dock [NAME]"></webui-toggle-icon>`;
    const moveableTemplate = `
<button data-setattr="[ID]|slot|left" aria-label="Set [name] to left" class="toggle-pos-left">
<webui-icon icon="drawer|rotate:90"></webui-icon>
</button>
<button data-setattr="[ID]|slot|right" aria-label="Set [name] to right" class="toggle-pos-right">
<webui-icon icon="drawer|rotate:-90"></webui-icon>
</button>
<button data-setattr="[ID]|slot|top" aria-label="Set [name] to top" class="toggle-pos-top">
<webui-icon icon="drawer|rotate:180"></webui-icon>
</button>
<button data-setattr="[ID]|slot|bottom" aria-label="Set [name] to bottom" class="toggle-pos-bottom">
<webui-icon icon="drawer"></webui-icon>
</button>`;
    // The site menu is called navigation, and any other drawer a panel, in its labels and tooltips.
    const isNavigation = el => !!el.querySelector('webui-nav') || el.classList.contains('nav');
    webui.define("webui-drawer", {
        preload: 'icon flex toggle-icon',
        linkCss: false,
        constructor() {
            const t = this;
            t._idselector = `#${t._id}`;
            t.headerSlot = t.template.querySelector('slot[name=header]');
            t.footerSlot = t.template.querySelector('slot[name=footer]');
            // Content changes can replace the footer. Rebuilding is a no-op when it is still in place.
            const observer = new MutationObserver(() => t.buildFooterContent());
            observer.observe(t, { childList: true, subtree: true });
        },
        connected() {
            const t = this;
            // A landmark lets screen reader users find the drawer, and covers content such as a logo above the menu.
            if (!t.hasAttribute('role')) t.setAttribute('role', 'complementary');
            if (!t.hasAttribute('aria-label')) t.setAttribute('aria-label', isNavigation(t) ? 'Menu' : 'Side panel');
            // The class or menu can arrive after the footer was built.
            t.buildFooterContent();
            setTimeout(() => {
                t.setAttribute('id', t._id);
            }, 100);
            t.checkResponsiveDocking();
        },
        onResize() {
            this.checkResponsiveDocking();
        },
        attr: ['position', 'docked', 'data-dockable', 'data-moveable'],
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'docked':
                    if (!t._forceUndocked) {
                        t._cacheDocked = !!value;
                    }
                    break;
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
        buildFooterContent() {
            const t = this;
            let fb = t.querySelectorAll('[slot="footer"]');
            let content = '';
            if (this.dataMoveable) { content += moveableTemplate; }
            if (this.dataDockable && !this._forceUndocked) { content += dockableTemplate; }
            const name = isNavigation(t) ? 'Navigation' : 'Panel';
            content = content.split('[ID]').join(this._idselector).split('[NAME]').join(name).split('[name]').join(name.toLowerCase());
            if (fb.length === 1 && content === t._footerContent) return;
            t._footerContent = content;
            fb.forEach(el => el.remove());
            fb = webui.create('webui-flex');
            fb.setAttribute('justify', 'center');
            fb.setAttribute('slot', 'footer');
            fb.innerHTML = content;
            this.appendChild(fb);
        },
        checkResponsiveDocking() {
            const isNarrow = window.innerWidth < 900;
            const t = this;
            t._forceUndocked = isNarrow;
            if (isNarrow) {
                if (t.hasAttribute('docked')) {
                    t.removeAttribute('docked');
                }
            } else if (t._cacheDocked && !t.hasAttribute('docked')) {
                t.setAttribute('docked', true);
            }
            t.buildFooterContent();
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
::-webkit-scrollbar,
*::-webkit-scrollbar {
background-color: var(--scroll-color);
box-shadow: var(--scroll-shadow);
}
::-webkit-scrollbar-thumb,
*::-webkit-scrollbar-thumb {
background-color: var(--theme-color);
}
slot:not([name]) {
display:flex;
flex-grow:1;
flex-direction:column;
overflow:auto;
--scroll-color: color-mix(in srgb, var(--theme-color) 20%, transparent);
--scroll-shadow: -4px 0 -4px rgba(255, 255, 255, 0.2) inset;
}
::-webkit-scrollbar {
width: 1em;
height: 1em;
}
::-webkit-scrollbar-thumb {
background: rgba(90, 90, 90, 0.2);
}
::-webkit-scrollbar-track {
background: rgba(0, 0, 0, 0.2);
}
slot:not([name])::after {
content:" ";
display:block;
min-height:2em;
}
#actions:empty {display:none;}
button {
background:none;
color:inherit;
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
flex-direction:row;
align-items:center;
}
:host([slot="bottom"]) ::slotted([slot="footer"]),
:host([slot="top"]) ::slotted([slot="footer"]) {
min-width:8rem;
}
</style>
`
    });
}
