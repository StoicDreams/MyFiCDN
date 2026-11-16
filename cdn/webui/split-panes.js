/*!
 * Web UI Split Panes - https://webui.stoicdreams.com/components#webui-split-panes
 * Two panes side by side, each scrolling on its own, with a bar between them that resizes them.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    /** The narrowest each pane can be, in pixels, unless the min attribute says otherwise. */
    const DEFAULT_MIN = 400;
    /** The width of the bar between the panes. */
    const BAR = 8;
    const KEY_STEP = 0.05;

    /** The closest element that scrolls, through shadow roots and slots, which fill sizes the panes to. */
    function scrollParent(node) {
        let at = node;
        while (at) {
            at = at.assignedSlot || at.parentElement || at.getRootNode?.().host;
            if (at?.nodeType === Node.ELEMENT_NODE && /^(auto|scroll)$/.test(getComputedStyle(at).overflowY)) return at;
        }
        return document.scrollingElement;
    }

    webui.define('webui-split-panes', {
        preload: 'icon',
        attr: ['ratio', 'min', 'show', 'start-label', 'end-label'],
        flags: ['fill'],
        constructor() {
            const t = this;
            t._bar = t.template.querySelector('.bar');
            t._toEnd = t.template.querySelector('.to-end');
            t._toStart = t.template.querySelector('.to-start');
            t._toEnd.addEventListener('click', () => t.showPane('end', true));
            t._toStart.addEventListener('click', () => t.showPane('start', true));
            t.setupDragging();
            // Narrow is checked against the panes' own width, and fill against the height of what scrolls them.
            t._sizeObserver = new ResizeObserver(() => t.checkNarrow());
            t._fillObserver = new ResizeObserver(() => t.fitHeight());
        },
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'ratio':
                case 'min':
                    t.applyRatio();
                    break;
                case 'startLabel':
                    t._toStart.querySelector('span').textContent = value || 'Back';
                    t._toStart.setAttribute('aria-label', value || 'Back');
                    break;
                case 'endLabel':
                    t._toEnd.querySelector('span').textContent = value || 'Open';
                    t._toEnd.setAttribute('aria-label', value || 'Open');
                    break;
                case 'fill':
                    t.watchFill();
                    break;
            }
        },
        connected() {
            const t = this;
            if (!t.hasAttribute('show')) t.setAttribute('show', 'end');
            t._sizeObserver.observe(t);
            t.watchFill();
            t.checkNarrow();
            t.applyRatio();
        },
        disconnected() {
            const t = this;
            t._sizeObserver.disconnect();
            t._fillObserver.disconnect();
            t._scroller = null;
        },
        /** The narrowest each pane can be. */
        minWidth() {
            const min = parseFloat(this.getAttribute('min'));
            return min >= 0 ? min : DEFAULT_MIN;
        },
        /** The start pane's share of the width, from 0 to 1. Each pane keeps at least its minimum when both fit. */
        currentRatio() {
            const t = this;
            const ratio = parseFloat(t.getAttribute('ratio'));
            return t.clampRatio(ratio >= 0 && ratio <= 1 ? ratio : 0.5);
        },
        clampRatio(ratio) {
            const t = this;
            const width = t.clientWidth - BAR;
            const min = t.minWidth();
            let value = Math.min(Math.max(ratio, 0), 1);
            if (width > 0 && width >= min * 2) value = Math.min(Math.max(value, min / width), 1 - min / width);
            return value;
        },
        applyRatio() {
            const t = this;
            const ratio = t.currentRatio();
            t.style.setProperty('--split-ratio', `${ratio}`);
            t.style.setProperty('--split-min', `${t.minWidth()}px`);
            t._bar.setAttribute('aria-valuenow', `${Math.round(ratio * 100)}`);
            return ratio;
        },
        /** Sets the ratio and tells the page, which can save it, with a change event. */
        setRatio(ratio) {
            const t = this;
            const value = Math.round(t.clampRatio(ratio) * 1000) / 1000;
            t.setAttribute('ratio', `${value}`);
            t.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { ratio: value } }));
            return value;
        },
        /** The bar resizes the panes by dragging, or with the arrow keys, Home, and End. Double click or Enter evens them. */
        setupDragging() {
            const t = this;
            const bar = t._bar;
            const ratioAt = x => {
                const rect = t.getBoundingClientRect();
                return (x - rect.left - BAR / 2) / Math.max(rect.width - BAR, 1);
            };
            bar.addEventListener('pointerdown', ev => {
                if (ev.button !== 0) return;
                ev.preventDefault();
                bar.setPointerCapture(ev.pointerId);
                t.classList.add('resizing');
            });
            bar.addEventListener('pointermove', ev => {
                if (!bar.hasPointerCapture(ev.pointerId)) return;
                // Drawn straight away, and the change event is sent once the drag ends.
                t._dragRatio = t.clampRatio(ratioAt(ev.clientX));
                t.style.setProperty('--split-ratio', `${t._dragRatio}`);
            });
            const endDrag = ev => {
                if (!bar.hasPointerCapture(ev.pointerId)) return;
                bar.releasePointerCapture(ev.pointerId);
                t.classList.remove('resizing');
                if (t._dragRatio !== undefined) t.setRatio(t._dragRatio);
                t._dragRatio = undefined;
            };
            bar.addEventListener('pointerup', endDrag);
            bar.addEventListener('pointercancel', endDrag);
            bar.addEventListener('dblclick', () => t.setRatio(0.5));
            bar.addEventListener('keydown', ev => {
                const ratio = t.currentRatio();
                switch (ev.key) {
                    case 'ArrowLeft': t.setRatio(ratio - KEY_STEP); break;
                    case 'ArrowRight': t.setRatio(ratio + KEY_STEP); break;
                    case 'Home': t.setRatio(0); break;
                    case 'End': t.setRatio(1); break;
                    case 'Enter': t.setRatio(0.5); break;
                    default: return;
                }
                ev.preventDefault();
            });
        },
        /** Too narrow for both panes at their minimum, the end pane covers the start pane, and show says which is seen. */
        checkNarrow() {
            const t = this;
            const narrow = t.clientWidth > 0 && t.clientWidth < t.minWidth() * 2 + BAR;
            if (narrow !== t.hasAttribute('narrow')) t.toggleAttribute('narrow', narrow);
            t.applyRatio();
        },
        /** Shows a pane while the end pane covers the start pane. With moveFocus, focus goes into it. */
        showPane(which, moveFocus) {
            const t = this;
            const pane = which === 'start' ? 'start' : 'end';
            t.setAttribute('show', pane);
            t.dispatchEvent(new CustomEvent('show', { bubbles: true, detail: { pane } }));
            if (moveFocus) (pane === 'end' ? t._toStart : t._toEnd).focus();
        },
        /** With fill, the panes are as tall as the visible part of what scrolls them, below where they start. */
        watchFill() {
            const t = this;
            t._fillObserver.disconnect();
            t._scroller = null;
            if (!t.hasAttribute('fill') || !t.isConnected) {
                t.style.removeProperty('height');
                return;
            }
            t._scroller = scrollParent(t);
            if (t._scroller) t._fillObserver.observe(t._scroller);
            t.fitHeight();
        },
        fitHeight() {
            const t = this;
            const box = t._scroller;
            if (!box || !t.hasAttribute('fill')) return;
            const style = getComputedStyle(box);
            const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
            const page = box === document.scrollingElement;
            const visible = page ? window.innerHeight : box.clientHeight - padding;
            const boxTop = page ? 0 : box.getBoundingClientRect().top + box.clientTop + parseFloat(style.paddingTop);
            const above = t.getBoundingClientRect().top - boxTop + (page ? window.scrollY : box.scrollTop);
            t.style.height = `${Math.max(200, Math.floor(visible - Math.max(0, above)))}px`;
        },
        shadowTemplate: `
<div class="pane start" part="start"><slot name="start"></slot></div>
<button type="button" class="strip to-end" part="strip" aria-label="Open"><webui-icon icon="chevron" flip="x" aria-hidden="true"></webui-icon><span>Open</span></button>
<div class="bar" part="bar" role="separator" aria-orientation="vertical" aria-label="Resize the panes" aria-valuemin="0" aria-valuemax="100" tabindex="0" title="Drag to resize, double click to even"></div>
<div class="pane end" part="end">
<button type="button" class="strip to-start" part="strip" aria-label="Back"><webui-icon icon="chevron" aria-hidden="true"></webui-icon><span>Back</span></button>
<div class="end-body"><slot name="end"></slot></div>
</div>
<style type="text/css">
:host {
display: flex;
position: relative;
width: 100%;
min-height: 200px;
overflow: hidden;
}
:host(.resizing) {
user-select: none;
cursor: ew-resize;
}
.pane {
min-width: 0;
min-height: 0;
}
.start {
flex: 0 1 calc((100% - ${BAR}px) * var(--split-ratio, 0.5));
min-width: var(--split-min, ${DEFAULT_MIN}px);
overflow: auto;
}
.end {
flex: 1 1 0;
min-width: var(--split-min, ${DEFAULT_MIN}px);
display: flex;
}
.end-body {
flex: 1 1 auto;
min-width: 0;
overflow: auto;
}
.bar {
flex: 0 0 ${BAR}px;
cursor: ew-resize;
touch-action: none;
background-color: color-mix(in srgb, currentColor 10%, transparent);
}
.bar:hover,
.bar:focus-visible,
:host(.resizing) .bar {
background-color: color-mix(in srgb, currentColor 30%, transparent);
outline: none;
}
.strip {
display: none;
flex: 0 0 auto;
flex-direction: column;
align-items: center;
gap: 0.5em;
width: 2.5em;
padding: 0.75em 0;
border: none;
font: inherit;
color: inherit;
cursor: pointer;
background-color: color-mix(in srgb, currentColor 8%, var(--color-background, transparent));
}
.strip:hover,
.strip:focus-visible {
background-color: color-mix(in srgb, currentColor 18%, var(--color-background, transparent));
outline: none;
}
.strip span {
writing-mode: vertical-rl;
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
}
:host([narrow]) .bar {
display: none;
}
:host([narrow]) .start {
flex: 1 1 auto;
min-width: 0;
}
:host([narrow]) .end {
position: absolute;
inset: 0;
min-width: 0;
z-index: 2;
background-color: var(--color-background, white);
box-shadow: 0 0 1em rgba(0, 0, 0, 0.4);
}
:host([narrow][show="start"]) .end {
display: none;
}
:host([narrow][show="start"]) .to-end,
:host([narrow]) .to-start {
display: flex;
}
</style>
`,
    });
}
