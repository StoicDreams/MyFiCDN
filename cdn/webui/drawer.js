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
<webui-toggle-icon style="--toggle-icon-padding:0;" data-toggleattr="[ID]|docked" data-enabled="[ID]" icon-on="arrow-side-from-square|rotate:180" icon-off="drawer|rotate:90" title-on="Hide [NAME]" flags-on="" flags-off="fill" title-off="Dock [NAME]"></webui-toggle-icon>`;
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
    const MOVE_SLOTS = {
        left: 'drawer|rotate:90',
        right: 'drawer|rotate:-90',
        top: 'drawer|rotate:180',
        bottom: 'drawer',
    };
    /** The slots a moveable drawer can move to: those `data-moveable` lists, such as `left|right`, or all four. */
    function moveSlots(value) {
        const listed = `${value ?? ''}`.split(/[|,\s]+/).filter(slot => MOVE_SLOTS[slot]);
        return listed.length ? listed : Object.keys(MOVE_SLOTS);
    }
    function moveableTemplate(slots) {
        return slots.map(slot => `
<button data-setattr="[ID]|slot|${slot}" aria-label="Set [name] to ${slot}" class="toggle-pos-${slot}">
<webui-icon icon="${MOVE_SLOTS[slot]}"></webui-icon>
</button>`).join('');
    }
    // The site menu is called navigation, and any other drawer a panel, in its labels and tooltips.
    const isNavigation = el => !!el.querySelector('webui-nav') || el.classList.contains('nav');
    webui.define("webui-drawer", {
        preload: 'icon flex toggle-icon',
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
            // The window can come back at its full size without a resize reaching the page, such as after the
            // screen was locked, so the docking is checked again whenever it shows or gets focus.
            if (!t._onShown) {
                t._onShown = () => {
                    if (document.visibilityState === 'visible') t.checkResponsiveDocking();
                };
                document.addEventListener('visibilitychange', t._onShown);
                window.addEventListener('focus', t._onShown);
            }
        },
        disconnected() {
            const t = this;
            if (!t._onShown) return;
            document.removeEventListener('visibilitychange', t._onShown);
            window.removeEventListener('focus', t._onShown);
            t._onShown = null;
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
                    // The dock button shows the state the drawer is in, however it changed, such as by the close button.
                    t.querySelector(':scope > [slot="footer"] webui-toggle-icon')?.setValue?.(t.hasAttribute('docked'));
                    // Docked and undocked can have different limits.
                    t.applyWidth(parseFloat(t.getAttribute('width')));
                    break;
                case 'dataDockable':
                    t.dataDockable = true;
                    t.buildFooterContent();
                    break;
                case 'dataMoveable':
                    t.dataMoveable = true;
                    t.keepToMoveSlots();
                    t.buildFooterContent();
                    break;
                case 'slot':
                    // A slot saved before the drawer was limited, such as top, moves it back to one it may use.
                    if (t.keepToMoveSlots()) break;
                    t.applyWidth(parseFloat(t.getAttribute('width')));
                    break;
                case 'resizable':
                case 'width':
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
            if (this.dataMoveable) { content += moveableTemplate(moveSlots(t.getAttribute('data-moveable'))); }
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
        /** Moves a drawer limited by data-moveable out of a slot it may not use. Says whether it moved. */
        keepToMoveSlots() {
            const t = this;
            const slot = t.getAttribute('slot');
            if (!t.hasAttribute('data-moveable') || !slot) return false;
            const slots = moveSlots(t.getAttribute('data-moveable'));
            if (slots.includes(slot)) return false;
            t.setAttribute('slot', slots[0]);
            return true;
        },
        /**
         * The value saved for an attribute in data-state, for the loader. A narrow window undocks the drawer only for
         * as long as it is narrow, so the drawer is saved as the user left it, and comes back docked after a reload
         * that happened while the window was narrow, such as while the screen was locked.
         */
        stateValue(attr) {
            const t = this;
            if (attr !== 'docked' || !t._forceUndocked) return undefined;
            return t._cacheDocked ? 'true' : null;
        },
        checkResponsiveDocking() {
            // A window being hidden, minimized, or changing screens can report no width at all for a moment: only a
            // window with a width can be narrow.
            const width = window.innerWidth;
            const isNarrow = width > 0 && width < 900;
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
/* The handle has room of its own on the inner edge, so it never covers the start of the content. Its width is
   measured with that room in, so dragging the edge does not make the drawer jump by it. */
:host([resizable][slot="right"]) {
padding-left: 6px;
box-sizing: border-box;
}
:host([resizable][slot="left"]) {
padding-right: 6px;
box-sizing: border-box;
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
background-color: var(--color-scrollbar, color-mix(in srgb, var(--theme-color-offset, currentColor) 10%, transparent));
}
::-webkit-scrollbar-thumb,
*::-webkit-scrollbar-thumb {
background-color: var(--color-scrollbar-thumb, color-mix(in srgb, var(--theme-color-offset, currentColor) 45%, transparent));
}
slot:not([name]) {
display:flex;
flex-grow:1;
flex-direction:column;
overflow:auto;
}
::-webkit-scrollbar {
width: 1em;
height: 1em;
}
::-webkit-scrollbar-corner {
background: transparent;
}
slot:not([name])::after {
content:" ";
display:block;
min-height:2em;
}
:host([fill]) slot:not([name])::after {
display:none;
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
