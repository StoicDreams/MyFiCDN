/*!
 * Web UI Pinned Side - https://webui.stoicdreams.com/components#webui-pinned-side
 * A two column layout whose side column stays in view while the main column scrolls.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    const DEFAULT_SPLIT_WIDTH = 900;
    // One observer for every instance. Widths are read in the callback, where layout is already done,
    // and the split attribute is written in the next frame to avoid a ResizeObserver loop.
    const observer = new ResizeObserver(entries => {
        const changes = entries.map(entry => [entry.target, entry.contentRect.width >= entry.target._splitWidth]);
        requestAnimationFrame(() => {
            changes.forEach(([el, split]) => {
                if (el.hasAttribute('split') !== split) el.toggleAttribute('split', split);
            });
        });
    });
    webui.define('webui-pinned-side', {
        attr: ['side-width', 'split-width', 'gap'],
        flags: ['side-first', 'side-last'],
        constructor() {
            const t = this;
            t._splitWidth = DEFAULT_SPLIT_WIDTH;
        },
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'sideWidth':
                    t.style.setProperty('--side-width', webui.pxIfNumber(value));
                    break;
                case 'splitWidth':
                    t._splitWidth = parseFloat(value) || DEFAULT_SPLIT_WIDTH;
                    if (t._isConnected) {
                        observer.unobserve(t);
                        observer.observe(t);
                    }
                    break;
                case 'gap':
                    t.style.setProperty('--gap', webui.pxIfNumber(value));
                    break;
            }
        },
        connected() {
            observer.observe(this);
        },
        reconnected() {
            observer.observe(this);
        },
        disconnected() {
            observer.unobserve(this);
        },
        shadowTemplate: `
<div class="main" part="main"><slot></slot></div>
<div class="side" part="side"><slot name="side"></slot></div>
<style type="text/css">
:host {
--side-width: minmax(300px, 36%);
--gap: var(--padding, 1em);
display: flex;
flex-direction: column;
gap: var(--gap);
}
.main,
.side {
display: contents;
}
::slotted(*) {
order: 2;
min-width: 0;
}
::slotted(:first-child) {
order: 0;
}
::slotted([slot="side"]) {
order: 1;
}
:host([side-first]) ::slotted([slot="side"]) {
order: -1;
}
:host([side-last]) ::slotted([slot="side"]) {
order: 3;
}
:host([split]) {
display: grid;
grid-template-columns: minmax(0, 1fr) var(--side-width);
align-items: start;
}
:host([split]) .main,
:host([split]) .side {
display: flex;
flex-direction: column;
gap: var(--gap);
min-width: 0;
}
:host([split]) .side {
position: sticky;
top: 0;
max-height: calc(var(--main-height, 100vh) - 2 * var(--padding, 1em));
overflow-y: auto;
}
:host([split]) ::slotted(*) {
order: 0;
}
</style>
`
    });
}
