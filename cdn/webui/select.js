/*!
 * Web UI Select - https://webui.stoicdreams.com/components#webui-select
 * A field like webui-dropdown that opens its options as a grid of square tiles in a dialog, each with an icon.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    const SVG = 'http://www.w3.org/2000/svg';
    /** Options at which the dialog adds a field to filter them. */
    const FILTER_FROM = 13;
    /** The theme colors a tile without an icon is drawn in. Each name picks a pair, so tiles tell apart. */
    const MONOGRAM_COLORS = ['primary', 'secondary', 'tertiary', 'info', 'success', 'title', 'active'];

    // Reads options the way webui-dropdown does: an array, JSON, or "Display|id, Other|id2".
    function extractOptions(options) {
        if (options === undefined || options === null || options === '') return [];
        if (typeof options === 'string') {
            try {
                const items = JSON.parse(options);
                return Array.isArray(items) ? items : [];
            } catch {
                return options.split(',').map(item => {
                    item = item.trim();
                    const parts = item.indexOf('|') !== -1 ? item.split('|') : item.split(':');
                    return parts.length === 2 ? { id: parts[1], display: parts[0] } : { id: item, display: item };
                }).filter(item => item.id !== '');
            }
        }
        return Array.isArray(options) ? options : [];
    }

    function hashOf(text) {
        let hash = 0;
        for (const char of `${text}`) hash = (hash * 31 + char.codePointAt(0)) >>> 0;
        return hash;
    }

    /** One or two letters for a name: the first letters of its first two words, or of the one word. */
    function initialsOf(name) {
        const words = `${name}`.trim().split(/[\s_\-./]+/).filter(Boolean);
        if (!words.length) return '?';
        const letters = words.length > 1 ? [words[0], words[1]].map(word => [...word][0]) : [...words[0]].slice(0, 2);
        return letters.join('').toUpperCase();
    }

    function svgElement(name, attributes = {}) {
        const element = document.createElementNS(SVG, name);
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
        return element;
    }

    let monogramCount = 0;
    /**
     * The picture a tile shows when its option has no icon: a monogram. A rounded square in a soft gradient between
     * two theme colors, with a light pattern and a sheen across the top, and the option's initials in the first
     * color's offset, so they read in light and dark themes alike. The name picks the colors and the pattern.
     */
    function fallbackIcon(name) {
        const hash = hashOf(name);
        const base = MONOGRAM_COLORS[hash % MONOGRAM_COLORS.length];
        const blend = MONOGRAM_COLORS[(hash >>> 3) % MONOGRAM_COLORS.length === hash % MONOGRAM_COLORS.length
            ? (hash + 1) % MONOGRAM_COLORS.length
            : (hash >>> 3) % MONOGRAM_COLORS.length];
        // Ids are only unique within a document or shadow root, and several of these share one.
        const id = `webui-monogram-${++monogramCount}`;
        const svg = svgElement('svg', { viewBox: '0 0 100 100', class: 'fallback', 'aria-hidden': 'true', focusable: 'false' });
        const defs = svgElement('defs');
        const gradient = svgElement('linearGradient', { id: `${id}-fill`, x1: 0, y1: 0, x2: 1, y2: 1 });
        const from = svgElement('stop', { offset: '0' });
        from.style.stopColor = `var(--color-${base})`;
        const to = svgElement('stop', { offset: '1' });
        // Mostly the base color, so its offset still reads on the far corner.
        to.style.stopColor = `color-mix(in srgb, var(--color-${base}) 55%, var(--color-${blend}))`;
        gradient.append(from, to);
        const sheen = svgElement('linearGradient', { id: `${id}-sheen`, x1: 0, y1: 0, x2: 0, y2: 1 });
        sheen.append(
            svgElement('stop', { offset: '0', 'stop-color': '#ffffff', 'stop-opacity': '0.28' }),
            svgElement('stop', { offset: '0.55', 'stop-color': '#ffffff', 'stop-opacity': '0' }),
        );
        const clip = svgElement('clipPath', { id: `${id}-clip` });
        clip.append(svgElement('rect', { x: 0, y: 0, width: 100, height: 100, rx: 24 }));
        defs.append(gradient, sheen, clip);
        svg.append(defs);
        const art = svgElement('g', { 'clip-path': `url(#${id}-clip)` });
        art.append(svgElement('rect', { x: 0, y: 0, width: 100, height: 100, fill: `url(#${id}-fill)` }));
        const ink = `var(--color-${base}-offset)`;
        const pattern = svgElement('g', { fill: 'none', stroke: ink, 'stroke-opacity': '0.16', 'stroke-width': 6 });
        switch ((hash >>> 6) % 4) {
            case 0:
                // A wide arc rising from a corner, and a ring beside it.
                pattern.append(svgElement('circle', { cx: 100, cy: 104, r: 46 }), svgElement('circle', { cx: 18, cy: 20, r: 9 }));
                break;
            case 1:
                // Diagonal bands.
                [-20, 15, 50].forEach(offset => pattern.append(svgElement('path', { d: `M${offset} 100 L${offset + 60} 0`, 'stroke-width': 9 })));
                break;
            case 2:
                // A large soft circle, filled.
                pattern.setAttribute('stroke', 'none');
                pattern.append(svgElement('circle', { cx: 82, cy: 16, r: 34, fill: ink, 'fill-opacity': '0.12' }));
                pattern.append(svgElement('circle', { cx: 8, cy: 96, r: 22, fill: ink, 'fill-opacity': '0.08' }));
                break;
            default:
                // A grid of dots.
                pattern.setAttribute('stroke', 'none');
                for (let x = 12; x < 100; x += 19) {
                    for (let y = 12; y < 100; y += 19) pattern.append(svgElement('circle', { cx: x, cy: y, r: 2.6, fill: ink, 'fill-opacity': '0.16' }));
                }
        }
        art.append(pattern, svgElement('rect', { x: 0, y: 0, width: 100, height: 100, fill: `url(#${id}-sheen)` }));
        svg.append(art);
        svg.append(svgElement('rect', { x: 0.75, y: 0.75, width: 98.5, height: 98.5, rx: 23.5, fill: 'none', stroke: ink, 'stroke-opacity': '0.18', 'stroke-width': 1.5 }));
        const initials = initialsOf(name);
        const text = svgElement('text', {
            x: 50, y: 50, 'text-anchor': 'middle', 'dominant-baseline': 'central',
            'font-size': initials.length > 1 ? 38 : 46, 'font-weight': 700, 'letter-spacing': initials.length > 1 ? 1 : 0,
            'font-family': 'var(--font-family-display, var(--typography-family, system-ui, sans-serif))',
        });
        text.style.fill = ink;
        // Text, never markup: names come from data.
        text.textContent = initials;
        svg.append(text);
        return svg;
    }

    /** An option's picture: its image, its icon, or else the drawn monogram. */
    function iconFor(option, size) {
        if (option.image) {
            const image = document.createElement('img');
            image.className = 'image';
            image.alt = '';
            image.decoding = 'async';
            image.loading = 'lazy';
            image.src = option.image;
            // An image that can't load shows the monogram instead.
            image.addEventListener('error', () => image.replaceWith(fallbackIcon(option.display)), { once: true });
            return image;
        }
        if (option.icon) {
            const icon = document.createElement('webui-icon');
            icon.setAttribute('icon', option.icon);
            icon.setAttribute('aria-hidden', 'true');
            if (size) icon.style.fontSize = size;
            return icon;
        }
        return fallbackIcon(option.display);
    }

    const tileStyles = `
:host {
display:block;
--select-item-size:var(--webui-select-item-size, 7.5em);
--tile-surface:color-mix(in srgb, var(--color-background-offset, #fff) 6%, var(--color-background, #222));
--tile-border:color-mix(in srgb, var(--color-background-offset, #fff) 14%, transparent);
--tile-text:var(--color-background-offset, #fff);
--tile-accent:var(--color-active, #2f7);
--tile-accent-offset:var(--color-active-offset, #000);
}
.filter {
display:block;
box-sizing:border-box;
width:100%;
margin-bottom:calc(var(--padding, 0.5em) * 1.25);
padding:0.55em 0.85em;
font:inherit;
color:var(--color-field-offset, black);
background-color:var(--color-field, white);
border:1px solid var(--tile-border);
border-radius:999px;
}
.filter:focus-visible {
outline:var(--focus-outline, 2px solid currentColor);
outline-offset:var(--focus-offset, 2px);
}
.grid {
display:grid;
grid-template-columns:repeat(auto-fill, minmax(var(--select-item-size), 1fr));
gap:0.75em;
max-height:min(70vh, 42em);
overflow:auto;
padding:6px;
}
.tile {
position:relative;
display:flex;
flex-direction:column;
align-items:center;
justify-content:center;
gap:0.55em;
aspect-ratio:1;
min-width:0;
padding:0.75em 0.6em 0.6em;
box-sizing:border-box;
font:inherit;
text-align:center;
cursor:pointer;
color:var(--tile-text);
background-color:var(--tile-surface);
border:1px solid var(--tile-border);
border-radius:calc(var(--corners, 6px) * 2);
box-shadow:0 1px 2px rgb(0 0 0 / 18%);
transition:transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease, background-color 140ms ease;
}
.tile:hover {
transform:translateY(-2px);
border-color:color-mix(in srgb, var(--color-title, currentColor) 70%, transparent);
background-color:color-mix(in srgb, var(--color-title, #fff) 8%, var(--tile-surface));
box-shadow:0 6px 16px rgb(0 0 0 / 24%);
}
.tile[aria-selected="true"] {
border-color:var(--tile-accent);
background-color:color-mix(in srgb, var(--tile-accent) 12%, var(--tile-surface));
box-shadow:0 0 0 1px var(--tile-accent), 0 6px 16px rgb(0 0 0 / 20%);
}
.tile:focus-visible {
outline:var(--focus-outline, 2px solid currentColor);
outline-offset:var(--focus-offset, 3px);
}
.tile[hidden] {
display:none;
}
/* A check in the corner marks each chosen tile. */
.check {
position:absolute;
top:0.45em;
right:0.45em;
display:none;
width:1.35em;
height:1.35em;
border-radius:50%;
background-color:var(--tile-accent);
color:var(--tile-accent-offset);
box-shadow:0 1px 3px rgb(0 0 0 / 30%);
}
.check svg {
width:100%;
height:100%;
}
.tile[aria-selected="true"] .check {
display:block;
}
.picture {
display:flex;
align-items:center;
justify-content:center;
flex:1 1 auto;
min-height:0;
width:58%;
max-width:4.5em;
}
.picture img {
width:100%;
height:100%;
object-fit:contain;
filter:drop-shadow(0 2px 4px rgb(0 0 0 / 22%));
}
.picture svg {
width:100%;
height:auto;
max-height:100%;
filter:drop-shadow(0 2px 4px rgb(0 0 0 / 22%));
}
.picture webui-icon {
font-size:2.8em;
color:var(--color-title, currentColor);
}
.name {
display:-webkit-box;
-webkit-line-clamp:2;
-webkit-box-orient:vertical;
max-width:100%;
overflow:hidden;
line-height:1.2;
font-size:0.85em;
font-weight:600;
overflow-wrap:anywhere;
}
@media (prefers-reduced-motion: reduce) {
.tile {
transition:none;
}
.tile:hover {
transform:none;
}
}
`;

    webui.define('webui-select', {
        preload: 'icon dialogs',
        isInput: true,
        constructor() {
            const t = this;
            t._options = [];
            t._selected = [];
            t._forLabel = t.template.querySelector('label');
            t._label = t.template.querySelector('slot[name="label"]');
            t._picker = t.template.querySelector('button');
            t._picked = t._picker.querySelector('.picked');
            t._startIcon = t.template.querySelector('webui-icon.start');
            t._midIcon = t.template.querySelector('webui-icon.mid');
            t._endIcon = t.template.querySelector('webui-icon.end');
            t._picker.addEventListener('click', () => t.open());
            t._picker.addEventListener('keydown', ev => {
                if (['ArrowDown', 'ArrowUp'].includes(ev.key)) {
                    ev.preventDefault();
                    t.open();
                }
            });
        },
        flags: ['multiple', 'disabled'],
        attr: ['icon', 'start-icon', 'mid-icon', 'end-icon', 'label', 'stack', 'value', 'options', 'title', 'item-size', 'placeholder'],
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'options':
                    t.setOptions(value);
                    break;
                case 'label':
                    t._label.innerHTML = value || '';
                    t._forLabel.classList.toggle('hide', !value);
                    t.nameField();
                    break;
                case 'title':
                    t.nameField();
                    break;
                case 'startIcon':
                case 'icon':
                    t._startIcon.setAttribute('icon', value);
                    break;
                case 'midIcon':
                    t._midIcon.setAttribute('icon', value);
                    break;
                case 'endIcon':
                    t._endIcon.setAttribute('icon', value);
                    break;
                case 'value':
                    t.setValue(value);
                    break;
                case 'itemSize':
                    t.style.setProperty('--webui-select-item-size', webui.pxIfNumber(value));
                    break;
                case 'placeholder':
                    t.renderPicked();
                    break;
                case 'disabled':
                    t._picker.disabled = !!value;
                    if (value) t.setAttribute('aria-disabled', 'true');
                    else t.removeAttribute('aria-disabled');
                    break;
                case 'multiple':
                    t.setValue(t._selected);
                    break;
            }
        },
        connected() {
            const t = this;
            const id = webui.uuid();
            t._picker.id = `${id}-picker`;
            t._forLabel.setAttribute('for', t._picker.id);
            t.nameField();
            if (t._pendingValue !== undefined) t.setValue(t._pendingValue);
            else t.renderPicked();
        },
        disconnected() {
            this._dialog?.close?.();
        },
        /** The field's name for screen readers: its label, or without one the host's aria-label or title. */
        nameField() {
            const t = this;
            const label = (t._label.textContent || '').trim();
            const fallback = label ? '' : (t.getAttribute('aria-label') || t.getAttribute('title') || '').trim();
            if (fallback) t._picker.setAttribute('aria-label', fallback);
            else t._picker.removeAttribute('aria-label');
        },
        options(options) {
            this.setOptions(options);
        },
        /**
         * Sets the options: an array of strings or of objects with id (or value), display, and icon, as JSON, or as
         * "Display|id, Other|id2". data-id, data-display, and data-icon name other fields to read.
         */
        setOptions(options) {
            const t = this;
            const idKey = t.dataset.id;
            const displayKey = t.dataset.display;
            const iconKey = t.dataset.icon;
            const imageKey = t.dataset.image;
            t._options = extractOptions(options).map(item => {
                if (typeof item !== 'object' || item === null) item = { id: `${item}`, display: `${item}` };
                const id = webui.getDefined(idKey ? item[idKey] : undefined, item.id, item.value);
                if (id === undefined || id === null) return null;
                const display = `${webui.getDefined(displayKey ? item[displayKey] : undefined, item.display, item.name, id)}`;
                const icon = webui.getDefined(iconKey ? item[iconKey] : undefined, item.icon) || '';
                const image = webui.getDefined(imageKey ? item[imageKey] : undefined, item.image) || '';
                return { id: `${id}`, display, icon: `${icon}`, image: `${image}`, data: item };
            }).filter(Boolean);
            t._optionsSet = true;
            let value = t._pendingValue !== undefined ? t._pendingValue : t._selected;
            const dn = t.dataset.name;
            if (dn) {
                const saved = webui.getData(dn);
                if (Array.isArray(saved)) value = saved.map(item => webui.getDefined(item?.[idKey], item?.id, item?.value));
                else if (saved && typeof saved === 'object') value = webui.getDefined(saved[idKey], saved.id, saved.value) ?? value;
            }
            t.setValue(value, true);
        },
        props: {
            value: {
                get() { return this.multiple ? this._selected.join(',') : (this._selected[0] ?? ''); },
                set(value) { this.setValue(value); },
            },
            /** The chosen options' ids, for a multiple select. */
            values: {
                get() { return [...this._selected]; },
                set(value) { this.setValue(value); },
            },
            /** The chosen options' names, as the field shows them. */
            display: {
                get() { return this.selectedOptions().map(option => option.display).join(', '); },
            },
        },
        selectedOptions() {
            return this._selected.map(id => this._options.find(option => option.id === id)).filter(Boolean);
        },
        /** Chooses by id: one for a single select, or an array or comma separated list for a multiple one. */
        setValue(value, fromOptions = false) {
            const t = this;
            if (!t._isConnected || !t._optionsSet) {
                // Attributes and data can arrive before options or connection, so apply this once ready.
                t._pendingValue = value;
                return;
            }
            t._pendingValue = undefined;
            let ids = Array.isArray(value) ? value.map(v => `${v}`) : value === undefined || value === null || value === '' ? [] : `${value}`.split(t.multiple ? ',' : /$^/).map(v => v.trim());
            ids = ids.filter(id => t._options.some(option => option.id === id));
            if (!t.multiple) {
                // As webui-dropdown does, a single select shows its first option when given none that it has.
                ids = ids.length ? [ids[0]] : (t._options.length ? [t._options[0].id] : []);
            }
            const changed = ids.join('\n') !== t._selected.join('\n');
            t._selected = ids;
            t.renderPicked();
            if (changed || fromOptions) t.applyDataChange();
        },
        /** Puts the chosen options in data-name's data, as webui-dropdown does. */
        applyDataChange() {
            const t = this;
            const dn = t.dataset.name;
            if (!dn || !t._optionsSet) return;
            const chosen = t.selectedOptions().map(option => option.data);
            webui.setData(dn, t.multiple ? chosen : (chosen[0] ?? {}));
        },
        /** Shows the chosen options' icons and names in the field. */
        renderPicked() {
            const t = this;
            const chosen = t.selectedOptions();
            if (!chosen.length) {
                const placeholder = webui.create('span', { class: 'placeholder' });
                placeholder.textContent = t.getAttribute('placeholder') || '';
                t._picked.replaceChildren(placeholder);
                return;
            }
            t._picked.replaceChildren(...chosen.map(option => {
                const pick = webui.create('span', { class: 'pick' });
                const picture = webui.create('span', { class: 'pick-picture' });
                picture.append(iconFor(option));
                const name = webui.create('span', { class: 'pick-name' });
                name.textContent = option.display;
                pick.append(picture, name);
                return pick;
            }));
        },
        /** Opens the options as a grid of tiles in a dialog. */
        open() {
            const t = this;
            if (t.disabled || t._dialog || !t._options.length) return;
            const host = webui.create('div', { class: 'webui-select-dialog' });
            const root = host.attachShadow({ mode: 'open' });
            const style = document.createElement('style');
            style.textContent = tileStyles;
            const size = getComputedStyle(t).getPropertyValue('--webui-select-item-size').trim();
            if (size) host.style.setProperty('--webui-select-item-size', size);
            const grid = webui.create('div', { class: 'grid', role: 'listbox', 'aria-label': t.dialogTitle() });
            grid.setAttribute('aria-multiselectable', t.multiple ? 'true' : 'false');
            const tiles = t._options.map((option, index) => {
                const tile = webui.create('button', { type: 'button', class: 'tile', role: 'option', 'data-value': option.id });
                tile.setAttribute('aria-selected', t._selected.includes(option.id) ? 'true' : 'false');
                tile.tabIndex = -1;
                const picture = webui.create('span', { class: 'picture' });
                picture.append(iconFor(option));
                const name = webui.create('span', { class: 'name' });
                name.textContent = option.display;
                const check = webui.create('span', { class: 'check', 'aria-hidden': 'true' });
                check.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6.5 12.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                tile.append(check, picture, name);
                tile.addEventListener('click', ev => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    t.choose(option.id, tiles);
                });
                tile.dataset.index = index;
                return tile;
            });
            grid.append(...tiles);
            grid.addEventListener('keydown', ev => t.onGridKey(ev, tiles, grid));
            root.append(style);
            if (t._options.length >= FILTER_FROM) {
                const filter = webui.create('input', { type: 'search', class: 'filter', placeholder: 'Filter', 'aria-label': 'Filter the options' });
                filter.addEventListener('input', () => {
                    const words = filter.value.trim().toLowerCase();
                    tiles.forEach((tile, index) => { tile.hidden = !!words && !t._options[index].display.toLowerCase().includes(words); });
                });
                filter.addEventListener('keydown', ev => {
                    if (ev.key === 'ArrowDown' || ev.key === 'Enter') {
                        ev.preventDefault();
                        t.focusTile(tiles.find(tile => !tile.hidden), tiles);
                    }
                });
                root.append(filter);
            }
            root.append(grid);
            t._dialog = webui.dialog({
                title: t.dialogTitle(),
                content: host,
                minWidth: 'min(90vw, 40em)',
                // A single select closes when a tile is picked, so it needs no confirm button.
                confirm: t.multiple ? 'Done' : false,
                cancel: t.multiple ? undefined : 'Cancel',
            });
            Promise.resolve(t._dialog).catch(() => { }).finally(() => {
                t._dialog = null;
                t._picker.focus();
            });
            // Focus moves to the chosen tile once the dialog shows it.
            webui.wait(() => host.isConnected, 2000).then(() => {
                const start = tiles.find(tile => tile.getAttribute('aria-selected') === 'true') || tiles[0];
                t.focusTile(start, tiles);
            }).catch(() => { });
        },
        dialogTitle() {
            return this.getAttribute('title') || (this._label.textContent || '').trim() || 'Choose';
        },
        focusTile(tile, tiles) {
            if (!tile) return;
            tiles.forEach(other => { other.tabIndex = other === tile ? 0 : -1; });
            tile.focus();
        },
        /** Picks an option: a single select chooses it and closes, a multiple one turns it on or off. */
        choose(id, tiles) {
            const t = this;
            const before = t._selected.join('\n');
            if (t.multiple) {
                const ids = t._selected.includes(id) ? t._selected.filter(other => other !== id) : [...t._selected, id];
                // Kept in the options' order, whatever order they were picked in.
                t.setValue(t._options.map(option => option.id).filter(other => ids.includes(other)));
                tiles.forEach(tile => tile.setAttribute('aria-selected', t._selected.includes(tile.dataset.value) ? 'true' : 'false'));
            } else {
                t.setValue(id);
                t._dialog?.close?.();
            }
            if (t._selected.join('\n') !== before) t.triggerChange(true);
        },
        /** Arrow keys move through the grid by row and column, Home and End go to the ends, and Enter or Space picks. */
        onGridKey(ev, tiles, grid) {
            const t = this;
            const shown = tiles.filter(tile => !tile.hidden);
            const index = shown.indexOf(ev.target.closest?.('.tile'));
            if (index === -1) return;
            // Tiles in the first row share its top, which gives how many fit across.
            const top = shown[0].offsetTop;
            const columns = Math.max(1, shown.filter(tile => tile.offsetTop === top).length);
            const moves = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns };
            if (ev.key in moves) {
                ev.preventDefault();
                const next = index + moves[ev.key];
                if (next >= 0 && next < shown.length) t.focusTile(shown[next], tiles);
            } else if (ev.key === 'Home') {
                ev.preventDefault();
                t.focusTile(shown[0], tiles);
            } else if (ev.key === 'End') {
                ev.preventDefault();
                t.focusTile(shown[shown.length - 1], tiles);
            } else if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                ev.stopPropagation();
                t.choose(shown[index].dataset.value, tiles);
            }
        },
        shadowTemplate: `
<label class="hide">
<webui-icon class="start"></webui-icon>
<slot name="label"></slot>
<webui-icon class="mid"></webui-icon>
</label>
<div class="field">
<button type="button" aria-haspopup="dialog"><span class="picked"></span></button>
<webui-icon class="end"></webui-icon>
</div>
<style type="text/css">
:host {
display:flex;
gap:var(--padding,1rem);
position:relative;
box-sizing:border-box;
align-items:center;
width:100%;
width:-webkit-fill-available;
--theme-color:var(--color-field, white);
--theme-color-offset:var(--color-field-offset, black);
background-color:color-mix(in srgb, var(--theme-color) 90%, black);
color:var(--theme-color-offset);
}
/* Without a theme, the label sits on the page and only the field looks like a field, as with webui-dropdown. */
:host(:not([theme])) {
background-color:transparent;
color:inherit;
}
:host([stack]) {
display:grid;
}
.field {
display:flex;
flex-grow:1;
min-width:0;
}
button {
display:flex;
flex-grow:1;
align-items:center;
gap:var(--padding, 0.5em);
min-width:0;
min-height:2em;
padding:calc(0.5 * var(--padding, 8px)) var(--padding, 8px);
font:inherit;
text-align:start;
cursor:pointer;
border:1px solid var(--color-line-strong, transparent);
background-color:var(--theme-color);
color:var(--theme-color-offset);
border-radius:var(--corners-small, 4px);
}
button:focus-visible {
outline:var(--focus-outline, 2px solid currentColor);
outline-offset:var(--focus-offset, 2px);
}
.picked {
display:flex;
flex-grow:1;
flex-wrap:wrap;
align-items:center;
gap:var(--padding, 0.5em);
min-width:0;
}
.pick {
display:inline-flex;
align-items:center;
gap:0.4em;
min-width:0;
}
.pick-picture {
display:inline-flex;
width:1.4em;
height:1.4em;
flex:0 0 auto;
}
.pick-picture img {
width:100%;
height:100%;
object-fit:contain;
}
.pick-picture svg,
.pick-picture webui-icon {
width:100%;
height:100%;
}
.pick-name {
overflow:hidden;
text-overflow:ellipsis;
white-space:nowrap;
}
.placeholder {
opacity:0.7;
}
:host([disabled]) {
opacity:0.6;
}
:host([disabled]) button {
cursor:not-allowed;
}
label.hide {display:none;}
label {
display:flex;
align-items:center;
gap:var(--padding);
padding:var(--padding,1rem);
}
webui-icon:not([icon]) {display:none;}
@container container (max-width:600px) {
:host {
display:grid;
gap:0.1em;
}
}
</style>
`
    });
}
