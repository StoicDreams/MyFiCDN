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
    const closeTemplate = `
<button class="drawer-close" aria-label="Close [NAME]" title="Close [NAME]">
<webui-icon icon="xmark"></webui-icon>
</button>`;
    /** How narrow and wide a resizable drawer can be made, unless its docked-* or undocked-* attributes say otherwise. */
    const DEFAULT_MIN = '240px';
    const DEFAULT_MAX = '90%';
    const KEY_STEP = 32;
    /** A limit in pixels, from a number or px value, or a share of the window from a % or vw value. */
    function toPixels(value) {
        const match = /^\s*(\d+(?:\.\d+)?)\s*(px|%|vw)?\s*$/i.exec(`${value ?? ''}`);
        if (!match) return undefined;
        const amount = parseFloat(match[1]);
        const unit = (match[2] || 'px').toLowerCase();
        return unit === 'px' ? amount : window.innerWidth * amount / 100;
    }
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
            // Docked, it undocks too, so it stays closed instead of taking up the side of the page.
            t.addEventListener('click', ev => {
                if (!ev.target.closest || !ev.target.closest('.drawer-close')) return;
                ev.preventDefault();
                ev.stopPropagation();
                t.close();
            });
            t.setupResizing();
        },
        /** Close the drawer, undocking it first if it is docked. */
        close() {
            const t = this;
            if (t.hasAttribute('docked')) t.removeAttribute('docked');
            t.classList.remove('open');
        },
        isSideDrawer() {
            const slot = this.getAttribute('slot');
            return slot === 'left' || slot === 'right';
        },
        /** With resizable, a left or right drawer can be dragged wider or narrower from its inner edge. */
        setupResizing() {
            const t = this;
            const handle = t.template.querySelector('.resize');
            t._resizeHandle = handle;
            // Measured from where the drag started, so grabbing anywhere on the handle does not make the edge jump.
            let start;
            const widthAt = x => start.width + (t.getAttribute('slot') === 'left' ? x - start.x : start.x - x);
            handle.addEventListener('pointerdown', ev => {
                if (ev.button !== 0) return;
                ev.preventDefault();
                handle.setPointerCapture(ev.pointerId);
                start = { x: ev.clientX, width: t.getBoundingClientRect().width };
                t.classList.add('resizing');
            });
            handle.addEventListener('pointermove', ev => {
                if (!handle.hasPointerCapture(ev.pointerId)) return;
                // Drawn straight away, and saved once the drag ends, so a drag does not save on every move.
                t._dragWidth = t.clampWidth(widthAt(ev.clientX));
                t.applyWidth(t._dragWidth);
            });
            const endDrag = ev => {
                if (!handle.hasPointerCapture(ev.pointerId)) return;
                handle.releasePointerCapture(ev.pointerId);
                t.classList.remove('resizing');
                if (t._dragWidth !== undefined) t.setAttribute('width', `${t._dragWidth}`);
                t._dragWidth = undefined;
            };
            handle.addEventListener('pointerup', endDrag);
            handle.addEventListener('pointercancel', endDrag);
            // A double click goes back to the width the content needs.
            handle.addEventListener('dblclick', () => t.removeAttribute('width'));
            handle.addEventListener('keydown', ev => {
                const grow = t.getAttribute('slot') === 'left' ? 'ArrowRight' : 'ArrowLeft';
                const shrink = t.getAttribute('slot') === 'left' ? 'ArrowLeft' : 'ArrowRight';
                if (ev.key !== grow && ev.key !== shrink) return;
                ev.preventDefault();
                // The saved width, since the drawer can still be animating to it.
                const current = t.clampWidth(parseFloat(t.getAttribute('width')) || t.getBoundingClientRect().width);
                t.setAttribute('width', `${t.clampWidth(current + (ev.key === grow ? KEY_STEP : -KEY_STEP))}`);
            });
        },
        /**
         * The narrowest and widest the drawer can be in its current state, in pixels.
         * Set with docked-min-width, docked-max-width, undocked-min-width, and undocked-max-width.
         * It is never wider than the window, and the maximum wins when the minimum is larger.
         */
        widthLimits() {
            const t = this;
            const state = t.hasAttribute('docked') ? 'docked' : 'undocked';
            const read = (name, fallback) => toPixels(t.getAttribute(`${state}-${name}-width`)) ?? toPixels(fallback);
            const max = Math.min(read('max', DEFAULT_MAX), window.innerWidth);
            const min = Math.min(read('min', DEFAULT_MIN), max);
            return { min, max };
        },
        clampWidth(width) {
            const { min, max } = this.widthLimits();
            return Math.round(Math.max(min, Math.min(width, max)));
        },
        /** Size the drawer to the saved width, kept within its limits. Without a saved width, the content sets it within them. */
        applyWidth(width) {
            const t = this;
            if (!t._resizeHandle) return;
            const resizable = t.hasAttribute('resizable') && t.isSideDrawer();
            t._resizeHandle.hidden = !resizable;
            t._resizeHandle.setAttribute('aria-label', `Resize ${isNavigation(t) ? 'Navigation' : 'Panel'}`);
            const sizes = {};
            if (resizable) {
                const { min, max } = t.widthLimits();
                // Set here because the app limits side drawers to two thirds of the window.
                sizes['min-width'] = `${Math.round(min)}px`;
                sizes['max-width'] = `${Math.round(max)}px`;
                if (width) sizes.width = `${t.clampWidth(width)}px`;
            }
            // Only sizes the drawer set are removed, so a page's own style on it is kept.
            (t._appliedSizes || []).forEach(prop => { if (!(prop in sizes)) t.style.removeProperty(prop); });
            Object.entries(sizes).forEach(([prop, value]) => t.style.setProperty(prop, value));
            t._appliedSizes = Object.keys(sizes);
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
            t.applyWidth(parseFloat(t.getAttribute('width')));
        },
        onResize() {
            this.checkResponsiveDocking();
            // Limits can be shares of the window, and a saved width can be wider than a smaller window allows.
            this.applyWidth(parseFloat(this.getAttribute('width')));
        },
        attr: ['position', 'docked', 'data-dockable', 'data-moveable', 'resizable', 'width', 'slot',
            'docked-min-width', 'docked-max-width', 'undocked-min-width', 'undocked-max-width'],
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'docked':
                    if (!t._forceUndocked) {
                        t._cacheDocked = !!value;
                    }
                    // Docked and undocked can have different limits.
                    t.applyWidth(parseFloat(t.getAttribute('width')));
                    break;
                case 'dataDockable':
                    t.dataDockable = true;
                    t.buildFooterContent();
                    break;
                case 'dataMoveable':
                    t.dataMoveable = true;
                    t.buildFooterContent();
                    break;
                case 'resizable':
                case 'width':
                case 'slot':
                case 'dockedMinWidth':
                case 'dockedMaxWidth':
                case 'undockedMinWidth':
                case 'undockedMaxWidth':
                    t.applyWidth(parseFloat(t.getAttribute('width')));
                    break;
            }
        },
        buildFooterContent() {
            const t = this;
            let fb = t.querySelectorAll('[slot="footer"]');
            let content = '';
            if (this.dataMoveable) { content += moveableTemplate; }
            if (this.dataDockable && !this._forceUndocked) { content += dockableTemplate; }
            if (this.dataDockable) { content += closeTemplate; }
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
<div class="resize" role="separator" aria-orientation="vertical" aria-label="Resize" tabindex="0" title="Drag to resize, double click to reset" hidden></div>
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
:host(.resizing) {
transition: none;
user-select: none;
}
:host([docked]) {
position: relative;
}
.resize {
position: absolute;
top: 0;
bottom: 0;
width: 6px;
cursor: ew-resize;
z-index: 1;
touch-action: none;
}
.resize[hidden] {
display: none;
}
:host([slot="right"]) .resize {
left: 0;
}
:host([slot="left"]) .resize {
right: 0;
}
.resize:hover,
.resize:focus-visible,
:host(.resizing) .resize {
background-color: color-mix(in srgb, currentColor 30%, transparent);
outline: none;
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
