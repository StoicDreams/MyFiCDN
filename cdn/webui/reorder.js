/*!
 * Web UI Reorder - https://webui.stoicdreams.com/components#webui-reorder
 * Items put in order by dragging them, or with Alt+Up and Alt+Down from the keyboard.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    /** How far, in pixels, the pointer moves from where it went down before it drags, so a click stays a click. */
    const DRAG_START = 5;

    webui.define('webui-reorder', {
        attr: ['items', 'targets', 'handle'],
        constructor() {
            const t = this;
            t._drag = null;
            t.addEventListener('pointerdown', ev => t.pointerDown(ev));
            t.addEventListener('keydown', ev => t.keyDown(ev));
            // Links and images drag on their own, which would take the pointer away from the item.
            t.addEventListener('dragstart', ev => {
                if (t.itemFrom(ev)) ev.preventDefault();
            });
        },
        /** The items that move: `items` matched inside this, or its own children. */
        itemList() {
            const t = this;
            return [...t.querySelectorAll(t.getAttribute('items') || ':scope > *')];
        },
        /** Where an item can go: `targets` matched inside this, or the items. */
        targetList() {
            const t = this;
            const targets = t.getAttribute('targets');
            return targets ? [...t.querySelectorAll(targets)] : t.itemList();
        },
        /**
         * The item an event is for, and whether it started on its handle: the innermost item it passed through, so an
         * item inside another, such as a page in a folder, moves on its own. Markers with `place` never move.
         */
        itemFrom(ev) {
            const t = this;
            const items = new Set(t.itemList());
            const handle = t.getAttribute('handle') || '[data-reorder-handle]';
            const path = ev.composedPath();
            let onHandle = false;
            for (const node of path) {
                if (node === t) return null;
                if (!(node instanceof Element)) continue;
                if (!onHandle && node.matches(handle)) onHandle = true;
                if (items.has(node)) return onHandle && !node.hasAttribute('place') ? node : null;
            }
            return null;
        },
        /** Where an item is, to tell whether a move changed anything. */
        placeOf(item) {
            return [item.parentNode, item.nextElementSibling];
        },
        /** Tells the page an item moved, when it did. */
        moved(item, before) {
            const t = this;
            const [parent, next] = t.placeOf(item);
            if (parent === before[0] && next === before[1]) return false;
            t.dispatchEvent(new CustomEvent('reorder', { bubbles: true, detail: { item } }));
            return true;
        },
        /** Puts an item above or below a target, or the side a marker with `place` says. */
        putBy(item, target, fallback) {
            const place = target.getAttribute('place') || fallback;
            if (place === 'below') target.after(item);
            else target.before(item);
        },
        /**
         * Alt+Up and Alt+Down, or Alt+Left and Alt+Right for items in a row, move the focused item one place, as a drag
         * does, for people who do not use a mouse.
         */
        keyDown(ev) {
            const t = this;
            if (!ev.altKey || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(ev.key)) return;
            const item = t.itemFrom(ev);
            if (!item) return;
            ev.preventDefault();
            ev.stopPropagation();
            const focused = ev.composedPath()[0];
            const down = ev.key === 'ArrowDown' || ev.key === 'ArrowRight';
            const others = t.targetList().filter(el => el !== item && !item.contains(el));
            const candidates = down
                ? others.filter(el => item.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)
                : others.filter(el => item.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING).reverse();
            const before = t.placeOf(item);
            for (const target of candidates) {
                t.putBy(item, target, down ? 'below' : 'above');
                const [parent, next] = t.placeOf(item);
                if (parent !== before[0] || next !== before[1]) break;
            }
            t.moved(item, before);
            focused?.focus?.();
        },
        pointerDown(ev) {
            const t = this;
            if (ev.button !== 0 || t._drag) return;
            const item = t.itemFrom(ev);
            if (!item) return;
            ev.stopPropagation();
            const drag = { item, x: ev.clientX, y: ev.clientY, id: ev.pointerId, started: false, before: t.placeOf(item) };
            t._drag = drag;
            const move = e => t.pointerMove(e);
            const end = e => t.pointerUp(e);
            // The browser's text selection would cancel the drag in some browsers, so it is stopped meanwhile.
            const block = e => e.preventDefault();
            drag.stop = () => {
                window.removeEventListener('pointermove', move, true);
                window.removeEventListener('pointerup', end, true);
                window.removeEventListener('pointercancel', end, true);
                window.removeEventListener('selectstart', block, true);
                try { if (t.hasPointerCapture?.(drag.id)) t.releasePointerCapture(drag.id); } catch { /* Already released. */ }
            };
            window.addEventListener('pointermove', move, true);
            window.addEventListener('pointerup', end, true);
            window.addEventListener('pointercancel', end, true);
            window.addEventListener('selectstart', block, true);
        },
        pointerMove(ev) {
            const t = this;
            const drag = t._drag;
            if (!drag || ev.pointerId !== drag.id) return;
            if (!drag.started) {
                if (Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) < DRAG_START) return;
                drag.started = true;
                drag.marker = webui.create('div', { 'aria-hidden': 'true', 'data-reorder-drop': '' });
                // The drop line is in the page, among the items, so it is styled here rather than by the shadow root.
                drag.marker.style.cssText = 'height:0;margin:2px 0;border-top:3px dashed var(--color-info, currentColor);pointer-events:none;';
                drag.opacity = drag.item.style.opacity;
                drag.item.style.opacity = '0.5';
                drag.item.setAttribute('reorder-moving', '');
                t.setAttribute('dragging', '');
                document.getSelection?.()?.removeAllRanges();
                // Captured, the drag keeps every move however fast the pointer goes.
                try { t.setPointerCapture(drag.id); } catch { /* The pointer is already gone. */ }
                drag.item.after(drag.marker);
            }
            ev.preventDefault();
            // The drop goes beside the target the pointer is on, or the nearest one. Targets sharing the pointer's row
            // (a row or a wrapping grid) are told apart sideways; in a column it is before or after by height.
            const targets = t.targetList()
                .filter(el => el !== drag.item && !drag.item.contains(el))
                .map(el => ({ el, rect: el.getBoundingClientRect() }));
            const middleX = rect => rect.left + rect.width / 2;
            const middleY = rect => rect.top + rect.height / 2;
            const row = targets.filter(({ rect }) => ev.clientY >= rect.top && ev.clientY <= rect.bottom);
            let closest = null;
            // Over a target, the item takes its place: after it when coming from before it, before it otherwise, so
            // letting go anywhere on a target, its middle included, moves the item there.
            const over = row.find(({ rect }) => ev.clientX >= rect.left && ev.clientX <= rect.right);
            const takePlace = el => (drag.item.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING ? 'below' : 'above');
            if (over) {
                closest = { el: over.el, side: takePlace(over.el) };
            } else if (row.length > 1) {
                const near = row.reduce((best, item) => Math.abs(ev.clientX - middleX(item.rect)) < Math.abs(ev.clientX - middleX(best.rect)) ? item : best);
                closest = { el: near.el, side: ev.clientX > middleX(near.rect) ? 'below' : 'above' };
            } else if (row.length === 1) {
                closest = { el: row[0].el, side: ev.clientY > middleY(row[0].rect) ? 'below' : 'above' };
            } else if (targets.length) {
                // Off every target: the nearest row by height, then the nearest target in it sideways.
                const gap = rect => Math.min(Math.abs(ev.clientY - rect.top), Math.abs(ev.clientY - rect.bottom));
                const near = targets.reduce((best, item) => {
                    const diff = gap(item.rect) - gap(best.rect);
                    if (Math.abs(diff) > 1) return diff < 0 ? item : best;
                    return Math.abs(ev.clientX - middleX(item.rect)) < Math.abs(ev.clientX - middleX(best.rect)) ? item : best;
                });
                closest = { el: near.el, side: ev.clientY > middleY(near.rect) ? 'below' : 'above' };
            }
            if (closest) {
                // Between items in a row, the drop line stands upright beside them.
                const across = row.length > 1;
                if (drag.across !== across) {
                    drag.across = across;
                    drag.marker.style.cssText = across
                        ? 'width:0;align-self:stretch;margin:0 2px;border-left:3px dashed var(--color-info, currentColor);pointer-events:none;'
                        : 'height:0;margin:2px 0;border-top:3px dashed var(--color-info, currentColor);pointer-events:none;';
                }
                t.putBy(drag.marker, closest.el, closest.side);
            }
        },
        pointerUp(ev) {
            const t = this;
            const drag = t._drag;
            if (!drag || ev.pointerId !== drag.id) return;
            drag.stop();
            t._drag = null;
            if (!drag.started) return;
            if (ev.type === 'pointerup') drag.marker.after(drag.item);
            drag.marker.remove();
            drag.item.style.opacity = drag.opacity;
            drag.item.removeAttribute('reorder-moving');
            t.removeAttribute('dragging');
            // The click that ends a drag is not a click on the item.
            const swallow = e => {
                e.stopPropagation();
                e.preventDefault();
            };
            window.addEventListener('click', swallow, { capture: true, once: true });
            setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0);
            t.moved(drag.item, drag.before);
        },
        disconnected() {
            const t = this;
            if (!t._drag) return;
            t._drag.stop();
            t._drag.marker?.remove();
            t._drag = null;
        },
        shadowTemplate: `
<slot></slot>
<style type="text/css">
:host {
display: block;
}
:host([hidden]) {
display: none;
}
:host([dragging]) {
cursor: grabbing;
user-select: none;
}
</style>
`,
    });
}
