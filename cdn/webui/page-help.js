/*!
 * Web UI Page Help - https://webui.stoicdreams.com/components#webui-page-help
 * A floating help bubble that can be dragged anywhere, and opens the page's help content in a dialog.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    const defaultStorageKey = 'webui-page-help-position';
    // Movement smaller than this is a click, not a drag.
    const dragThreshold = 4;
    const edgeGap = 16;
    const animationMs = 220;
    const prefersReducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    /** A footer bar along the bottom of the window, so the bubble can sit just above it. */
    function findFooter(host) {
        const elements = document.elementsFromPoint(window.innerWidth - edgeGap * 2, window.innerHeight - 1);
        for (const el of elements) {
            if (el === host) continue;
            const footer = el.closest?.('footer');
            if (footer) return footer;
        }
        return null;
    }
    function readPosition(key) {
        try {
            const value = JSON.parse(webui.storage.getItem(key) || 'null');
            if (value && Number.isFinite(value.right) && Number.isFinite(value.bottom)) return value;
        } catch (_) {
            // A damaged value falls back to the default position.
        }
        return null;
    }
    webui.define("webui-page-help", {
        linkCss: false,
        watchVisibility: false,
        isInput: false,
        preload: 'icon',
        constructor() {
            const t = this;
            t._float = t.template.querySelector('.float');
            t._bubble = t.template.querySelector('button.bubble');
            t._icon = t.template.querySelector('button.bubble webui-icon');
            t._label = t.template.querySelector('button.bubble .label');
            t._dialog = t.template.querySelector('dialog');
            t._heading = t.template.querySelector('dialog h2');
            t._close = t.template.querySelector('dialog button.close');
            t._slot = t.template.querySelector('slot');
            // The footer can change height, such as when its content wraps.
            t._footerObserver = new ResizeObserver(() => t.placeAboveFooter());
            t._onResize = () => {
                t.placeAboveFooter();
                t.keepInView();
            };
            t._bubble.addEventListener('pointerdown', ev => t.startDrag(ev));
            t._bubble.addEventListener('pointermove', ev => t.moveDrag(ev));
            t._bubble.addEventListener('pointerup', ev => t.endDrag(ev));
            t._bubble.addEventListener('pointercancel', ev => t.endDrag(ev));
            t._bubble.addEventListener('click', ev => {
                // A drag ends with a click on the bubble, which should not open it.
                if (t._suppressClick) {
                    t._suppressClick = false;
                    ev.preventDefault();
                    return;
                }
                t.open();
            });
            t._close.addEventListener('click', () => t.close());
            t._dialog.addEventListener('cancel', ev => {
                ev.preventDefault();
                t.close();
            });
            t._dialog.addEventListener('click', ev => {
                // Backdrop clicks target the dialog itself. Keyboard activated buttons report 0,0, which is not a backdrop click.
                if (ev.target !== t._dialog || (ev.clientX === 0 && ev.clientY === 0)) return;
                const rect = t._dialog.getBoundingClientRect();
                const inside = rect.top <= ev.clientY && ev.clientY <= rect.bottom && rect.left <= ev.clientX && ev.clientX <= rect.right;
                if (!inside) t.close();
            });
            t._dialog.addEventListener('close', () => {
                t.classList.remove('open');
                t._closing = false;
                t._bubble.focus({ preventScroll: true });
            });
            t._slot.addEventListener('slotchange', () => t.checkContent());
        },
        attr: ['label', 'heading', 'icon', 'storage-key', 'right', 'bottom'],
        flags: [],
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'label':
                    t._label.textContent = value || 'Help';
                    t._bubble.setAttribute('aria-label', value || 'Help');
                    if (!t.getAttribute('heading')) t._heading.textContent = value || 'Help';
                    break;
                case 'heading':
                    t._heading.textContent = value || t.getAttribute('label') || 'Help';
                    break;
                case 'icon':
                    t._icon.setAttribute('icon', value || 'question');
                    break;
                case 'storageKey':
                    t.restorePosition();
                    break;
                case 'right':
                    t._float.style.setProperty('--page-help-right', webui.pxIfNumber(value));
                    break;
                case 'bottom':
                    t._float.style.setProperty('--page-help-bottom', webui.pxIfNumber(value));
                    break;
            }
        },
        connected() {
            const t = this;
            window.addEventListener('resize', t._onResize);
            // The top layer ignores transformed ancestors, which would otherwise position the bubble
            // relative to them instead of the window.
            try {
                if (t._float.showPopover && !t._float.matches(':popover-open')) t._float.showPopover();
            } catch (_) {
                // Without popover support the bubble is fixed to the window, which is right in most pages.
            }
            t.restorePosition();
            t.checkContent();
            // The app's footer can render after this, so look for it again shortly.
            t.placeAboveFooter();
            t._footerTimers = [100, 500, 1500, 3000].map(ms => setTimeout(() => t.placeAboveFooter(), ms));
        },
        disconnected() {
            const t = this;
            window.removeEventListener('resize', t._onResize);
            (t._footerTimers || []).forEach(clearTimeout);
            t._footerObserver.disconnect();
            t._footer = null;
            if (t._dialog.open) t._dialog.close();
        },
        getStorageKey() {
            return this.getAttribute('storage-key') || defaultStorageKey;
        },
        /** Hides the bubble when there is no help to show. */
        checkContent() {
            const t = this;
            const hasContent = t._slot.assignedNodes().some(node => node.nodeType === Node.ELEMENT_NODE || (node.textContent || '').trim());
            t.classList.toggle('has-content', hasContent);
            t._float.classList.toggle('has-content', hasContent);
        },
        placeAboveFooter() {
            const t = this;
            const footer = findFooter(t);
            if (footer !== t._footer) {
                t._footerObserver.disconnect();
                t._footer = footer;
                if (footer) t._footerObserver.observe(footer);
            }
            const footerTop = footer ? footer.getBoundingClientRect().top : window.innerHeight;
            t._float.style.setProperty('--page-help-footer', `${Math.max(0, Math.round(window.innerHeight - footerTop))}px`);
        },
        restorePosition() {
            const t = this;
            const saved = readPosition(t.getStorageKey());
            if (!saved) return;
            t.setPosition(saved.right, saved.bottom);
            requestAnimationFrame(() => t.keepInView());
        },
        /** Positions by distance from the right and bottom, so the bubble keeps its corner as the window resizes. */
        setPosition(right, bottom) {
            const t = this;
            t._float.style.right = `${Math.round(right)}px`;
            t._float.style.bottom = `${Math.round(bottom)}px`;
            t._float.classList.add('placed');
        },
        keepInView() {
            const t = this;
            if (!t._float.classList.contains('placed')) return;
            const rect = t._float.getBoundingClientRect();
            if (!rect.width) return;
            const right = Math.min(Math.max(0, window.innerWidth - rect.right), window.innerWidth - rect.width);
            const bottom = Math.min(Math.max(0, window.innerHeight - rect.bottom), window.innerHeight - rect.height);
            if (Math.round(right) !== Math.round(window.innerWidth - rect.right) || Math.round(bottom) !== Math.round(window.innerHeight - rect.bottom)) {
                t.setPosition(Math.max(0, right), Math.max(0, bottom));
            }
        },
        resetPosition() {
            const t = this;
            webui.storage.removeItem(t.getStorageKey());
            ['right', 'bottom'].forEach(side => t._float.style.removeProperty(side));
            t._float.classList.remove('placed');
            t.placeAboveFooter();
        },
        startDrag(ev) {
            const t = this;
            if (ev.button !== 0) return;
            const rect = t._float.getBoundingClientRect();
            t._drag = { x: ev.clientX, y: ev.clientY, left: rect.left, top: rect.top, width: rect.width, height: rect.height, moved: false, id: ev.pointerId };
            t._bubble.setPointerCapture?.(ev.pointerId);
        },
        moveDrag(ev) {
            const t = this;
            const drag = t._drag;
            if (!drag || drag.id !== ev.pointerId) return;
            const dx = ev.clientX - drag.x;
            const dy = ev.clientY - drag.y;
            if (!drag.moved && Math.hypot(dx, dy) < dragThreshold) return;
            drag.moved = true;
            t.classList.add('dragging');
            const left = Math.min(Math.max(0, drag.left + dx), window.innerWidth - drag.width);
            const top = Math.min(Math.max(0, drag.top + dy), window.innerHeight - drag.height);
            t.setPosition(window.innerWidth - left - drag.width, window.innerHeight - top - drag.height);
        },
        endDrag(ev) {
            const t = this;
            const drag = t._drag;
            if (!drag || drag.id !== ev.pointerId) return;
            t._drag = null;
            t._bubble.releasePointerCapture?.(ev.pointerId);
            t.classList.remove('dragging');
            if (!drag.moved) return;
            t._suppressClick = ev.type === 'pointerup';
            const rect = t._float.getBoundingClientRect();
            webui.storage.setItem(t.getStorageKey(), JSON.stringify({
                right: Math.round(window.innerWidth - rect.right),
                bottom: Math.round(window.innerHeight - rect.bottom),
            }));
        },
        /** Grows the dialog out of the bubble, or shrinks it back into it. */
        animateFromBubble(reverse) {
            const t = this;
            if (prefersReducedMotion() || typeof t._dialog.animate !== 'function') return Promise.resolve();
            const bubble = t._bubble.getBoundingClientRect();
            const dialog = t._dialog.getBoundingClientRect();
            if (!dialog.width || !dialog.height) return Promise.resolve();
            const dx = (bubble.left + bubble.width / 2) - (dialog.left + dialog.width / 2);
            const dy = (bubble.top + bubble.height / 2) - (dialog.top + dialog.height / 2);
            const scale = Math.max(0.05, Math.min(bubble.width / dialog.width, bubble.height / dialog.height));
            const small = { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0 };
            const full = { transform: 'translate(0, 0) scale(1)', opacity: 1 };
            const animation = t._dialog.animate(reverse ? [full, small] : [small, full], { duration: animationMs, easing: 'ease-out' });
            return animation.finished.catch(() => { });
        },
        open() {
            const t = this;
            if (t._dialog.open) return;
            t._closing = false;
            t._dialog.showModal();
            t.classList.add('open');
            t._close.focus({ preventScroll: true });
            t.animateFromBubble(false);
        },
        async close() {
            const t = this;
            if (!t._dialog.open || t._closing) return;
            t._closing = true;
            await t.animateFromBubble(true);
            if (t._dialog.open) t._dialog.close();
        },
        shadowTemplate: `
<div class="float" popover="manual">
<button type="button" class="bubble" part="bubble" aria-haspopup="dialog" aria-label="Help">
<webui-icon icon="question"></webui-icon>
<span class="label">Help</span>
</button>
</div>
<dialog part="dialog" aria-label="Help">
<header>
<h2>Help</h2>
<button type="button" class="close" aria-label="Close help"><webui-icon icon="xmark"></webui-icon></button>
</header>
<section class="body"><slot></slot></section>
</dialog>
<style type="text/css">
:host {
display: contents;
--theme-color: var(--color-title, #1878af);
--theme-color-offset: var(--color-title-offset, white);
}
.float {
position: fixed;
z-index: 90;
inset: auto;
right: var(--page-help-right, ${edgeGap}px);
bottom: calc(var(--page-help-footer, 0px) + var(--page-help-bottom, ${edgeGap}px));
margin: 0;
padding: 0;
border: none;
overflow: visible;
background: none;
color: inherit;
}
.float:not(.has-content) {
display: none;
}
button {
font: inherit;
color: inherit;
cursor: pointer;
border: none;
}
.bubble {
display: inline-flex;
align-items: center;
gap: 0.4em;
padding: 0.5em 0.9em;
border-radius: 2em;
background-color: var(--theme-color);
color: var(--theme-color-offset);
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
touch-action: none;
user-select: none;
transition: opacity 150ms, transform 150ms;
}
.bubble:hover {
transform: scale(1.05);
}
.bubble:focus-visible {
outline: 2px solid var(--theme-color-offset);
outline-offset: 2px;
}
:host(.dragging) .bubble {
cursor: grabbing;
transform: scale(1.05);
}
:host(.open) .bubble {
opacity: 0;
pointer-events: none;
}
dialog {
padding: 0;
border: none;
border-radius: var(--corners, 6px);
width: var(--page-help-width, min(1000px, 94vw));
max-width: 94vw;
max-height: 85vh;
flex-direction: column;
background-color: var(--color-background, #fff);
color: var(--color-background-offset, #000);
box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
overflow: hidden;
}
dialog[open] {
display: flex;
}
dialog::backdrop {
background-color: rgb(0 0 0 / 45%);
backdrop-filter: var(--backdrop-blur, blur(4px));
}
header {
display: flex;
align-items: center;
gap: var(--padding, 0.5em);
padding: var(--padding, 0.5em) calc(2 * var(--padding, 0.5em));
background-color: var(--theme-color);
color: var(--theme-color-offset);
}
h2 {
flex: 1;
margin: 0;
font-size: 1.2em;
}
.close {
display: inline-flex;
padding: 0.25em 0.5em;
background: none;
border-radius: var(--corners, 4px);
}
.close:hover,
.close:focus-visible {
background-color: rgb(0 0 0 / 20%);
}
.body {
overflow: auto;
padding: calc(2 * var(--padding, 0.5em));
min-height: 0;
}
@media (prefers-reduced-motion: reduce) {
.bubble {
transition: none;
}
}
</style>
`
    });
}
