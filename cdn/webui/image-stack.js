/*!
 * Web UI Image Stack - https://webui.stoicdreams.com/components#webui-image-stack
 * Images stacked on top of one another, each offset from the one above it; clicking one brings it to the top.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    const DEFAULT_OFFSET = 24;
    const DEFAULT_TRANSITION = 500;
    const DEFAULT_MAX_ROTATION = 6;
    /** A number from an attribute, or `fallback` when it isn't one. */
    const number = (value, fallback) => {
        const n = parseFloat(value);
        return Number.isFinite(n) ? n : fallback;
    };
    webui.define('webui-image-stack', {
        attr: ['offset-x', 'offset-y', 'transition', 'max-rotation'],
        flags: ['rotate'],
        constructor() {
            const t = this;
            /** The images, top of the stack first. */
            t._order = [];
            t.setAttribute('role', 'group');
        },
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'transition':
                    t.style.setProperty('--image-stack-transition', `${Math.max(0, number(value, DEFAULT_TRANSITION))}ms`);
                    break;
                case 'offsetX':
                case 'offsetY':
                case 'maxRotation':
                case 'rotate':
                    t.render();
                    break;
            }
        },
        /** The images written inside the stack. */
        images() {
            return Array.from(this.querySelectorAll(':scope > img'));
        },
        /** Each image's own rotation (degrees): its `data-rotation`, else a random tilt kept on it. */
        rotationOf(img) {
            const t = this;
            let r = parseFloat(img.dataset.rotation);
            if (!Number.isFinite(r)) {
                const max = Math.abs(number(t.maxRotation, DEFAULT_MAX_ROTATION));
                // Between a third of the limit and the limit, either way, so a tilt always shows.
                const size = max / 3 + Math.random() * (max * 2 / 3);
                r = Math.round((Math.random() < 0.5 ? -size : size) * 10) / 10;
                img.dataset.rotation = `${r}`;
            }
            return r;
        },
        /** Brings `img` (one of the stack's images) to the top. */
        bringToTop(img) {
            const t = this;
            if (!t._order.includes(img) || t._order[0] === img) return;
            t._order = [img, ...t._order.filter(i => i !== img)];
            t.render();
            t.dispatchEvent(new CustomEvent('change', { detail: { image: img }, bubbles: true }));
        },
        /** Takes up images added since the last look (new ones go to the bottom) and drops removed ones. */
        sync() {
            const t = this;
            const images = t.images();
            t._order = t._order.filter(i => images.includes(i)).concat(images.filter(i => !t._order.includes(i)));
            for (const img of images) {
                if (img._webuiStack === t) continue;
                img._webuiStack = t;
                img.setAttribute('tabindex', '0');
                img.setAttribute('role', 'button');
                img.addEventListener('load', () => t.fit());
                img.addEventListener('click', () => t.bringToTop(img));
                img.addEventListener('keydown', ev => {
                    if (ev.key !== 'Enter' && ev.key !== ' ') return;
                    ev.preventDefault();
                    t.bringToTop(img);
                });
            }
        },
        /** Sizes every image by one scale, the largest that lets each fit the stack's room, so they keep their sizes
            relative to one another. The room is measured by the resize observer; the sizes are written next frame. */
        fit() {
            const t = this;
            const room = t._room;
            if (!room || !t._order) return;
            const loaded = t._order.filter(img => img.naturalWidth > 0 && img.naturalHeight > 0);
            if (!loaded.length) return;
            let scale = 1;
            for (const img of loaded) {
                scale = Math.min(scale, room.width / img.naturalWidth);
                if (room.height) scale = Math.min(scale, room.height / img.naturalHeight);
            }
            scale = Math.max(0, scale);
            cancelAnimationFrame(t._fitFrame);
            t._fitFrame = requestAnimationFrame(() => {
                for (const img of loaded) img.style.width = `${Math.floor(img.naturalWidth * scale)}px`;
            });
        },
        /** Places every image by its place in the stack. */
        render() {
            const t = this;
            if (!t._order) return;
            const ox = number(t.offsetX, DEFAULT_OFFSET);
            const oy = number(t.offsetY, DEFAULT_OFFSET);
            const count = t._order.length;
            // Room for the deepest image's offset, so nothing spills out of the stack.
            t.style.setProperty('--image-stack-pad-x', `${Math.max(0, ox) * Math.max(0, count - 1)}px`);
            t.style.setProperty('--image-stack-pad-y', `${Math.max(0, oy) * Math.max(0, count - 1)}px`);
            t.style.setProperty('--image-stack-pad-left', `${Math.max(0, -ox) * Math.max(0, count - 1)}px`);
            t.style.setProperty('--image-stack-pad-top', `${Math.max(0, -oy) * Math.max(0, count - 1)}px`);
            t._order.forEach((img, depth) => {
                const turn = t.rotate && depth > 0 ? t.rotationOf(img) : 0;
                img.style.zIndex = `${count - depth}`;
                img.style.transform = `translate(${ox * depth}px, ${oy * depth}px) rotate(${turn}deg)`;
                img.setAttribute('aria-pressed', depth === 0 ? 'true' : 'false');
                const name = img.getAttribute('alt') || img.getAttribute('title') || '';
                img.setAttribute('aria-label', depth === 0 ? name : `Bring to front: ${name}`);
            });
        },
        connected() {
            const t = this;
            if (!t.hasAttribute('transition')) t.style.setProperty('--image-stack-transition', `${DEFAULT_TRANSITION}ms`);
            t.sync();
            t.render();
            t._observer = new MutationObserver(() => { t.sync(); t.render(); t.fit(); });
            t._observer.observe(t, { childList: true });
            // The room inside the padding the offsets take. Height only counts when the stack is given one.
            t._resize = new ResizeObserver(() => {
                const style = getComputedStyle(t);
                const px = name => parseFloat(style[name]) || 0;
                const width = t.clientWidth - px('paddingLeft') - px('paddingRight');
                const height = t.style.height || t.style.maxHeight ? t.clientHeight - px('paddingTop') - px('paddingBottom') : 0;
                t._room = { width: Math.max(0, width), height: Math.max(0, height) };
                t.fit();
            });
            t._resize.observe(t);
        },
        reconnected() {
            const t = this;
            t._observer?.observe(t, { childList: true });
            t._resize?.observe(t);
        },
        disconnected() {
            this._observer?.disconnect();
            this._resize?.disconnect();
        },
        shadowTemplate: `
<slot></slot>
<style type="text/css">
:host {
display:grid;
grid-template:minmax(0, 1fr) / minmax(0, max-content);
justify-content:center;
box-sizing:border-box;
padding:var(--image-stack-pad-top, 0) var(--image-stack-pad-x, 0) var(--image-stack-pad-y, 0) var(--image-stack-pad-left, 0);
}
::slotted(img) {
grid-area:1 / 1;
justify-self:start;
align-self:start;
max-width:100%;
max-height:100%;
min-width:0;
min-height:0;
object-fit:contain;
cursor:pointer;
transform-origin:center;
transition:transform var(--image-stack-transition, 500ms) cubic-bezier(0.65, 0, 0.35, 1);
}
::slotted(img[aria-pressed="true"]) {
cursor:default;
}
::slotted(img:focus-visible) {
outline:var(--focus-outline, 2px solid currentColor);
outline-offset:var(--focus-offset, 2px);
}
@media (prefers-reduced-motion: reduce) {
::slotted(img) { transition:none; }
}
</style>
`
    });
}
