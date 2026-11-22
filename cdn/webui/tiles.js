/*!
 * Web UI Tiles - https://webui.stoicdreams.com/components#webui-tiles
 * Tiles in a grid, as many to a row as fit, with an optional field to find them.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    /** The words of a search, lowercased, so each can be looked for on its own. */
    const wordsOf = text => `${text ?? ''}`.toLowerCase().split(/\s+/).filter(Boolean);

    webui.define('webui-tiles', {
        preload: 'input-text',
        attr: ['min', 'gap', 'find', 'count-label', 'empty', 'label'],
        constructor() {
            const t = this;
            t._tools = t.template.querySelector('.tools');
            t._find = t.template.querySelector('webui-input-text');
            t._count = t.template.querySelector('.count');
            t._grid = t.template.querySelector('.grid');
            t._none = t.template.querySelector('.none');
            t._query = '';
            // The field's own value is only read from what it sends, since it may not be built yet when this runs.
            t._find.addEventListener('input', ev => {
                const field = ev.composedPath()[0];
                t._query = `${field?.value ?? ''}`;
                t.filter();
            });
            t.template.querySelector('slot').addEventListener('slotchange', () => {
                t.markItems();
                t.filter();
            });
            // Tiles can be added, renamed, or given new words while the page runs, so what is found follows them.
            t._observer = new MutationObserver(() => t.filter());
        },
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'min':
                    if (value) t.style.setProperty('--tile-min', webui.pxIfNumber(value));
                    else t.style.removeProperty('--tile-min');
                    break;
                case 'gap':
                    if (value) t.style.setProperty('--tile-gap', webui.pxIfNumber(value));
                    else t.style.removeProperty('--tile-gap');
                    break;
                case 'find':
                    t._tools.hidden = !value;
                    t._find.setAttribute('label', value || '');
                    if (!value) t.query = '';
                    t.filter();
                    break;
                case 'countLabel':
                case 'empty':
                    t.filter();
                    break;
                case 'label':
                    if (value) {
                        t._grid.setAttribute('role', 'list');
                        t._grid.setAttribute('aria-label', value);
                    } else {
                        t._grid.removeAttribute('role');
                        t._grid.removeAttribute('aria-label');
                    }
                    t.markItems();
                    break;
            }
        },
        connected() {
            const t = this;
            t._tools.hidden = !t.getAttribute('find');
            t._observer.observe(t, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['data-find', 'hidden'] });
            t.filter();
        },
        disconnected() {
            this._observer.disconnect();
        },
        props: {
            /** What was typed in the find field. Setting it finds those tiles, as typing does. */
            'query': {
                get() { return this._query ?? ''; },
                set(value) {
                    const t = this;
                    t._query = `${value ?? ''}`;
                    t._find.setAttribute('value', t._query);
                    t.filter();
                },
            },
        },
        /**
         * Shows the tiles that have every word of the query in their `data-find`, or in their text when they have none,
         * ignoring case. Sends a `filter` event with the query and how many tiles show, when that changes.
         */
        /**
         * A labelled set of tiles is a list for screen readers, so each tile is one of its items. A role the page gave a
         * tile is kept, and only the roles this set are taken away when the label is.
         */
        markItems() {
            const t = this;
            const isList = t.hasAttribute('label') && !!t.getAttribute('label');
            [...t.children].forEach(tile => {
                if (tile.hasAttribute('slot')) return;
                if (isList && !tile.hasAttribute('role')) {
                    tile.setAttribute('role', 'listitem');
                    tile.dataset.tileRole = '';
                } else if (!isList && tile.dataset.tileRole !== undefined) {
                    tile.removeAttribute('role');
                    delete tile.dataset.tileRole;
                }
            });
        },
        filter() {
            const t = this;
            if (!t._grid) return;
            const words = t.getAttribute('find') ? wordsOf(t.query) : [];
            // A tile the page hides itself is never counted or shown.
            const tiles = [...t.children].filter(tile => !tile.hasAttribute('hidden') && !tile.hasAttribute('slot'));
            let shown = 0;
            tiles.forEach(tile => {
                const text = `${tile.dataset.find ?? tile.textContent ?? ''}`.toLowerCase();
                const show = words.every(word => text.includes(word));
                if (show) shown++;
                if (show === tile.hasAttribute('filtered-out')) tile.toggleAttribute('filtered-out', !show);
            });
            const [one, many] = (t.getAttribute('count-label') || 'tile|tiles').split('|');
            const noun = count => (count === 1 ? one : (many || one));
            const counted = words.length ? `${shown} of ${tiles.length} ${noun(tiles.length)}` : `${tiles.length} ${noun(tiles.length)}`;
            if (t._count.textContent !== counted) t._count.textContent = counted;
            const none = !!words.length && !!tiles.length && shown === 0;
            t._none.hidden = !none;
            const nothing = t.getAttribute('empty') || 'Nothing matches that.';
            if (t._none.textContent !== nothing) t._none.textContent = nothing;
            const result = `${words.join(' ')}|${shown}|${tiles.length}`;
            if (result === t._lastResult) return;
            t._lastResult = result;
            t.dispatchEvent(new CustomEvent('filter', { bubbles: true, detail: { query: t.query, shown, total: tiles.length } }));
        },
        shadowTemplate: `
<div class="tools" part="tools" hidden>
<webui-input-text class="find" part="find"></webui-input-text>
<span class="count" part="count" aria-live="polite"></span>
</div>
<div class="grid" part="grid"><slot></slot></div>
<p class="none" part="none" hidden></p>
<style type="text/css">
:host {
--tile-min: 16em;
--tile-gap: var(--padding, 8px);
display: block;
}
:host([hidden]) {
display: none;
}
[hidden] {
display: none !important;
}
.tools {
display: flex;
flex-wrap: wrap;
align-items: center;
gap: calc(var(--padding, 8px) / 2) var(--padding, 8px);
margin-bottom: var(--padding, 8px);
}
.find {
flex: 0 1 20em;
}
.count,
.none {
color: var(--color-muted, inherit);
}
.grid {
display: grid;
grid-template-columns: repeat(auto-fill, minmax(min(var(--tile-min), 100%), 1fr));
gap: var(--tile-gap);
}
::slotted(*) {
min-width: 0;
}
::slotted([wide]) {
grid-column: 1 / -1;
}
::slotted([filtered-out]),
::slotted([hidden]) {
display: none !important;
}
</style>
`,
    });
}
