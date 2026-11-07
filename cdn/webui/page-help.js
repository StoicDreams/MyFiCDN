/*!
 * Web UI Page Help - https://webui.stoicdreams.com/components#webui-page-help
 * A floating help bubble that opens the page's help in a panel. Both can be dragged anywhere, and the
 * panel leaves the page usable, so it can stay open as a reference.
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
    const minPanelWidth = 240;
    const minPanelHeight = 120;
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
    function readSaved(key, fields) {
        try {
            const value = JSON.parse(webui.storage.getItem(key) || 'null');
            if (value && fields.every(field => Number.isFinite(value[field]))) return value;
        } catch (_) {
            // A damaged value falls back to the default.
        }
        return null;
    }
    const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
    const preventSelection = ev => ev.preventDefault();
    /**
     * Stops a drag from selecting text on the page as the pointer passes over it. CSS on the handle alone is not
     * enough, since WebKit only honors the prefixed property and the pointer leaves the handle while dragging.
     */
    function blockSelection() {
        const root = document.documentElement.style;
        const previous = [root.userSelect, root.webkitUserSelect];
        root.userSelect = 'none';
        root.webkitUserSelect = 'none';
        document.addEventListener('selectstart', preventSelection, true);
        window.getSelection?.()?.removeAllRanges();
        return () => {
            root.userSelect = previous[0];
            root.webkitUserSelect = previous[1];
            document.removeEventListener('selectstart', preventSelection, true);
        };
    }
    /** Shows an element in the top layer, which ignores transformed ancestors that would otherwise move it. */
    function showOnTop(el) {
        try {
            if (el.showPopover && !el.matches(':popover-open')) el.showPopover();
        } catch (_) {
            // Without popover support it stays fixed to the window, which is right in most pages.
        }
        el.classList.add('shown');
    }
    function hideFromTop(el) {
        try {
            if (el.hidePopover && el.matches(':popover-open')) el.hidePopover();
        } catch (_) {
            // Already hidden.
        }
        el.classList.remove('shown');
    }
    /**
     * Lets the pointer drag something by a handle. Positions are kept inside the window.
     * onMove receives the new left and top, and onEnd runs once a drag that moved has finished.
     */
    function trackDrag(handle, { getRect, onMove, onEnd, skip }) {
        let drag = null;
        handle.addEventListener('pointerdown', ev => {
            if (ev.button !== 0 || skip?.(ev)) return;
            const rect = getRect();
            drag = { x: ev.clientX, y: ev.clientY, left: rect.left, top: rect.top, width: rect.width, height: rect.height, moved: false, id: ev.pointerId, unblock: blockSelection() };
            handle.setPointerCapture?.(ev.pointerId);
        });
        handle.addEventListener('pointermove', ev => {
            if (!drag || drag.id !== ev.pointerId) return;
            const dx = ev.clientX - drag.x;
            const dy = ev.clientY - drag.y;
            if (!drag.moved && Math.hypot(dx, dy) < dragThreshold) return;
            drag.moved = true;
            const left = clamp(drag.left + dx, 0, Math.max(0, window.innerWidth - drag.width));
            const top = clamp(drag.top + dy, 0, Math.max(0, window.innerHeight - drag.height));
            onMove(left, top, drag);
        });
        const finish = ev => {
            if (!drag || drag.id !== ev.pointerId) return;
            const ended = drag;
            drag = null;
            ended.unblock();
            handle.releasePointerCapture?.(ev.pointerId);
            if (ended.moved) onEnd(ev.type === 'pointerup');
        };
        handle.addEventListener('pointerup', finish);
        handle.addEventListener('pointercancel', finish);
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
            t._panel = t.template.querySelector('.panel');
            t._header = t.template.querySelector('.panel header');
            t._heading = t.template.querySelector('.panel h2');
            t._close = t.template.querySelector('.panel button.close');
            t._slot = t.template.querySelector('slot');
            // The footer can change height, such as when its content wraps.
            t._footerObserver = new ResizeObserver(() => t.placeAboveFooter());
            t._onResize = () => {
                t.placeAboveFooter();
                t.keepInView();
                t.keepPanelInView();
            };
            trackDrag(t._bubble, {
                getRect: () => t._float.getBoundingClientRect(),
                onMove: (left, top, drag) => {
                    t.classList.add('dragging');
                    t.setPosition(window.innerWidth - left - drag.width, window.innerHeight - top - drag.height);
                },
                onEnd: wasPointerUp => {
                    t.classList.remove('dragging');
                    // A drag ends with a click on the bubble, which should not open it.
                    t._suppressClick = wasPointerUp;
                    const rect = t._float.getBoundingClientRect();
                    webui.storage.setItem(t.getStorageKey(), JSON.stringify({
                        right: Math.round(window.innerWidth - rect.right),
                        bottom: Math.round(window.innerHeight - rect.bottom),
                    }));
                },
            });
            t._bubble.addEventListener('pointerup', () => t.classList.remove('dragging'));
            t._bubble.addEventListener('click', ev => {
                if (t._suppressClick) {
                    t._suppressClick = false;
                    ev.preventDefault();
                    return;
                }
                t.open();
            });
            trackDrag(t._header, {
                getRect: () => t._panel.getBoundingClientRect(),
                skip: ev => !!ev.target.closest?.('button'),
                onMove: (left, top) => {
                    t.classList.add('moving');
                    t.setPanelPlace(left, top);
                },
                onEnd: () => {
                    t.classList.remove('moving');
                    t.savePanel();
                },
            });
            // The resize handle belongs to the panel itself, so a press on the panel rather than its content is a resize.
            t._panel.addEventListener('pointerdown', ev => {
                if (ev.target !== t._panel) return;
                const rect = t._panel.getBoundingClientRect();
                t._resizeFrom = { width: rect.width, height: rect.height, unblock: blockSelection() };
                window.addEventListener('pointerup', t._onResizeEnd, { once: true });
                window.addEventListener('pointercancel', t._onResizeEnd, { once: true });
            });
            t._onResizeEnd = () => {
                const from = t._resizeFrom;
                t._resizeFrom = null;
                if (!from) return;
                from.unblock();
                window.removeEventListener('pointerup', t._onResizeEnd);
                window.removeEventListener('pointercancel', t._onResizeEnd);
                const rect = t._panel.getBoundingClientRect();
                if (Math.round(rect.width) !== Math.round(from.width) || Math.round(rect.height) !== Math.round(from.height)) {
                    t._panel.style.width = `${Math.round(rect.width)}px`;
                    t._panel.style.height = `${Math.round(rect.height)}px`;
                    t.keepPanelInView();
                    t.savePanel();
                }
            };
            t._panel.addEventListener('keydown', ev => {
                if (ev.key === 'Escape') {
                    ev.stopPropagation();
                    t.close();
                }
            });
            t._close.addEventListener('click', () => t.close());
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
            showOnTop(t._float);
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
            hideFromTop(t._panel);
            t.classList.remove('open');
        },
        getStorageKey() {
            return this.getAttribute('storage-key') || defaultStorageKey;
        },
        getPanelStorageKey() {
            return `${this.getStorageKey()}-panel`;
        },
        isOpen() {
            return this._panel.classList.contains('shown');
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
            const saved = readSaved(t.getStorageKey(), ['right', 'bottom']);
            if (!saved) return;
            t.setPosition(saved.right, saved.bottom);
            requestAnimationFrame(() => t.keepInView());
        },
        /** Positions the bubble by distance from the right and bottom, so it keeps its corner as the window resizes. */
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
            const right = clamp(window.innerWidth - rect.right, 0, Math.max(0, window.innerWidth - rect.width));
            const bottom = clamp(window.innerHeight - rect.bottom, 0, Math.max(0, window.innerHeight - rect.height));
            if (Math.round(right) !== Math.round(window.innerWidth - rect.right) || Math.round(bottom) !== Math.round(window.innerHeight - rect.bottom)) {
                t.setPosition(right, bottom);
            }
        },
        /** Forgets where the bubble and panel were moved, and the panel's size. */
        resetPosition() {
            const t = this;
            webui.storage.removeItem(t.getStorageKey());
            webui.storage.removeItem(t.getPanelStorageKey());
            ['right', 'bottom'].forEach(side => t._float.style.removeProperty(side));
            ['left', 'top', 'width', 'height'].forEach(prop => t._panel.style.removeProperty(prop));
            t._float.classList.remove('placed');
            t.placeAboveFooter();
            if (t.isOpen()) t.placePanel();
        },
        setPanelPlace(left, top) {
            const t = this;
            t._panel.style.left = `${Math.round(left)}px`;
            t._panel.style.top = `${Math.round(top)}px`;
        },
        /** Opens the panel where it was left, or else with its corner at the bubble's corner. */
        placePanel() {
            const t = this;
            const saved = readSaved(t.getPanelStorageKey(), ['left', 'top']);
            if (saved && Number.isFinite(saved.width) && Number.isFinite(saved.height)) {
                t._panel.style.width = `${Math.max(minPanelWidth, saved.width)}px`;
                t._panel.style.height = `${Math.max(minPanelHeight, saved.height)}px`;
            }
            const rect = t._panel.getBoundingClientRect();
            if (saved) {
                t.setPanelPlace(saved.left, saved.top);
            } else {
                const bubble = t._float.getBoundingClientRect();
                t.setPanelPlace(bubble.right - rect.width, bubble.bottom - rect.height);
            }
            t.keepPanelInView();
        },
        /** Keeps the panel inside the window, shrinking it when the window is smaller than the panel. */
        keepPanelInView() {
            const t = this;
            if (!t.isOpen()) return;
            let rect = t._panel.getBoundingClientRect();
            if (!rect.width) return;
            if (rect.width > window.innerWidth) t._panel.style.width = `${Math.max(minPanelWidth, window.innerWidth)}px`;
            if (rect.height > window.innerHeight) t._panel.style.height = `${Math.max(minPanelHeight, window.innerHeight)}px`;
            rect = t._panel.getBoundingClientRect();
            t.setPanelPlace(
                clamp(rect.left, 0, Math.max(0, window.innerWidth - rect.width)),
                clamp(rect.top, 0, Math.max(0, window.innerHeight - rect.height)));
        },
        savePanel() {
            const t = this;
            const rect = t._panel.getBoundingClientRect();
            const value = { left: Math.round(rect.left), top: Math.round(rect.top) };
            // Only a size the user chose is kept, so content can still decide the size until then.
            if (t._panel.style.width && t._panel.style.height) {
                value.width = Math.round(rect.width);
                value.height = Math.round(rect.height);
            }
            webui.storage.setItem(t.getPanelStorageKey(), JSON.stringify(value));
        },
        /** Grows the panel out of the bubble, or shrinks it back into it. */
        animateFromBubble(reverse) {
            const t = this;
            if (prefersReducedMotion() || typeof t._panel.animate !== 'function') return Promise.resolve();
            const bubble = t._bubble.getBoundingClientRect();
            const panel = t._panel.getBoundingClientRect();
            if (!panel.width || !panel.height) return Promise.resolve();
            const dx = (bubble.left + bubble.width / 2) - (panel.left + panel.width / 2);
            const dy = (bubble.top + bubble.height / 2) - (panel.top + panel.height / 2);
            const scale = Math.max(0.05, Math.min(bubble.width / panel.width, bubble.height / panel.height));
            const small = { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0 };
            const full = { transform: 'translate(0, 0) scale(1)', opacity: 1 };
            const animation = t._panel.animate(reverse ? [full, small] : [small, full], { duration: animationMs, easing: 'ease-out' });
            return animation.finished.catch(() => { });
        },
        open() {
            const t = this;
            if (t.isOpen()) return;
            t._closing = false;
            showOnTop(t._panel);
            t.placePanel();
            t.classList.add('open');
            t._close.focus({ preventScroll: true });
            t.animateFromBubble(false);
        },
        async close() {
            const t = this;
            if (!t.isOpen() || t._closing) return;
            t._closing = true;
            // Only take focus back when it was in the panel, so closing never pulls focus from the page.
            const hadFocus = t.shadowRoot?.activeElement && t._panel.contains(t.shadowRoot.activeElement);
            await t.animateFromBubble(true);
            hideFromTop(t._panel);
            t.classList.remove('open');
            t._closing = false;
            if (hadFocus) t._bubble.focus({ preventScroll: true });
        },
        toggle() {
            return this.isOpen() ? this.close() : this.open();
        },
        shadowTemplate: `
<div class="float" popover="manual">
<button type="button" class="bubble" part="bubble" aria-haspopup="dialog" aria-label="Help">
<webui-icon icon="question"></webui-icon>
<span class="label">Help</span>
</button>
</div>
<section class="panel" part="panel" popover="manual" role="dialog" aria-modal="false" aria-labelledby="page-help-heading">
<header title="Drag to move">
<h2 id="page-help-heading">Help</h2>
<button type="button" class="close" aria-label="Close help"><webui-icon icon="xmark"></webui-icon></button>
</header>
<div class="body"><slot></slot></div>
</section>
<style type="text/css">
:host {
display: contents;
--theme-color: var(--color-title, #1878af);
--theme-color-offset: var(--color-title-offset, white);
}
.float,
.panel {
position: fixed;
inset: auto;
margin: 0;
color: inherit;
}
.float {
z-index: 90;
right: var(--page-help-right, ${edgeGap}px);
bottom: calc(var(--page-help-footer, 0px) + var(--page-help-bottom, ${edgeGap}px));
padding: 0;
border: none;
overflow: visible;
background: none;
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
-webkit-user-select: none;
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
.panel {
z-index: 91;
display: none;
flex-direction: column;
left: 0;
top: 0;
padding: 0;
border: none;
border-radius: var(--corners, 6px);
width: var(--page-help-width, min(600px, calc(100vw - ${edgeGap * 2}px)));
height: auto;
max-height: calc(100vh - ${edgeGap * 2}px);
min-width: ${minPanelWidth}px;
min-height: ${minPanelHeight}px;
background-color: var(--color-background, #fff);
color: var(--color-background-offset, #000);
box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
overflow: hidden;
resize: both;
}
.panel.shown {
display: flex;
}
header {
display: flex;
align-items: center;
gap: var(--padding, 0.5em);
padding: var(--padding, 0.5em) calc(2 * var(--padding, 0.5em));
background-color: var(--theme-color);
color: var(--theme-color-offset);
cursor: grab;
touch-action: none;
-webkit-user-select: none;
user-select: none;
}
:host(.moving) header {
cursor: grabbing;
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
flex: 1;
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
