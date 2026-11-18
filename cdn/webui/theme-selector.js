/*!
 * Web UI Theme Selector - https://webui.stoicdreams.com/components#webui-theme-selector
 * A header button that lets visitors choose between the site's themes, adjust a theme's colors, and remembers both.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    // The loader reads these keys on startup and applies them before the page draws, so a saved theme or its
    // adjusted colors never flash the default.
    const DATA_KEY = 'session-theme';
    // Adjusted colors, by theme: { [theme]: { '--color-primary': '#5e0592', '--color-primary-offset': 'var(--color-white)' } }.
    const COLORS_KEY = 'session-theme-colors';
    /** The base colors an editable selector adjusts. Each one's offset follows it. */
    const EDITABLE = [
        ['background', 'Background'],
        ['title', 'Title'],
        ['primary', 'Primary'],
        ['secondary', 'Secondary'],
        ['tertiary', 'Tertiary'],
        ['active', 'Active'],
        ['button', 'Button'],
    ];
    const MANAGED = EDITABLE.flatMap(([name]) => [`--color-${name}`, `--color-${name}-offset`]);
    const SCHEMES = [['light', 'Light'], ['dark', 'Dark']];
    /** The colors last saved here, so the change coming back from setData isn't applied twice. */
    let lastSaved = null;
    /** Colors changed but not saved yet, since saving waits for a pause while a color is dragged. */
    let pending = null;
    let saveTimer = 0;

    function currentTheme() {
        return document.documentElement.dataset.theme || '';
    }

    /** Every theme's adjusted colors, including changes not saved yet. */
    function savedColors() {
        if (pending) return pending;
        const value = webui.getData(COLORS_KEY);
        return value && typeof value === 'object' ? value : {};
    }

    /** A CSS color as [red, green, blue], as the page draws it, or null. */
    function resolveColor(css) {
        const probe = document.createElement('span');
        probe.style.display = 'none';
        probe.style.color = css;
        (document.body || document.documentElement).appendChild(probe);
        const value = getComputedStyle(probe).color;
        probe.remove();
        let match = value.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
        if (match) return match.slice(1, 4).map(Number);
        match = value.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
        if (match) return match.slice(1, 4).map(part => Number(part) * 255);
        return null;
    }

    function toHex(rgb) {
        return `#${rgb.map(part => Math.max(0, Math.min(255, Math.round(part))).toString(16).padStart(2, '0')).join('')}`;
    }

    function luminance(rgb) {
        const [r, g, b] = rgb.map(part => {
            const value = part / 255;
            return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    /** The WCAG contrast ratio between two colors. */
    function contrast(a, b) {
        const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
        return (light + 0.05) / (dark + 0.05);
    }

    /** The site's white or black, whichever reads better on `color`, as the offset to use with it. */
    function offsetFor(color) {
        const rgb = resolveColor(color);
        const white = resolveColor('var(--color-white)') || [255, 255, 255];
        const black = resolveColor('var(--color-black)') || [16, 16, 16];
        if (!rgb) return 'var(--color-white)';
        return contrast(rgb, white) >= contrast(rgb, black) ? 'var(--color-white)' : 'var(--color-black)';
    }

    /** Puts a theme's adjusted colors on the page, in place of any another theme had. */
    function applyColors(theme) {
        const style = document.documentElement.style;
        MANAGED.forEach(property => style.removeProperty(property));
        Object.entries(savedColors()[theme] || {}).forEach(([property, value]) => {
            if (MANAGED.includes(property) && typeof value === 'string') style.setProperty(property, value);
        });
    }

    function syncThemeColor() {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) return;
        const background = getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim();
        if (background && meta.getAttribute('content') !== background) meta.setAttribute('content', background);
    }

    function renderPanels() {
        document.querySelectorAll('webui-theme-selector[panel]').forEach(el => el.render());
    }

    function applyTheme(value) {
        flushColors();
        const root = document.documentElement;
        if (value) root.dataset.theme = value;
        else delete root.dataset.theme;
        applyColors(value);
        if (webui.getData(DATA_KEY) !== value) webui.setData(DATA_KEY, value);
        syncThemeColor();
        renderPanels();
    }

    function saveColors(colors, now = false) {
        clearTimeout(saveTimer);
        pending = colors;
        if (now) flushColors();
        else saveTimer = setTimeout(flushColors, 250);
    }

    /** Saves colors changed but not saved yet. */
    function flushColors() {
        clearTimeout(saveTimer);
        if (!pending) return;
        const colors = pending;
        pending = null;
        lastSaved = JSON.stringify(colors);
        webui.setData(COLORS_KEY, colors);
    }

    /** Sets one base color for the theme in use, and its offset to whichever of white or black reads better. */
    function setColor(name, color, saveNow) {
        const theme = currentTheme();
        const colors = JSON.parse(JSON.stringify(savedColors()));
        const adjusted = colors[theme] ||= {};
        adjusted[`--color-${name}`] = color;
        adjusted[`--color-${name}-offset`] = offsetFor(color);
        const style = document.documentElement.style;
        style.setProperty(`--color-${name}`, color);
        style.setProperty(`--color-${name}-offset`, adjusted[`--color-${name}-offset`]);
        saveColors(colors, saveNow);
        if (name === 'background') syncThemeColor();
        document.querySelectorAll('webui-theme-selector[panel]').forEach(el => el.showReset());
    }
    function themeOptions(el) {
        return [...el.querySelectorAll(':scope > option')].map(option => ({
            value: option.value || '',
            name: option.textContent.trim() || option.value || 'Default',
            colors: (option.dataset.colors || '').split(/\s+/).filter(c => c),
            scheme: option.dataset.scheme || '',
        }));
    }

    webui.define('webui-theme-selector', {
        preload: 'icon dialogs',
        attr: ['title', 'data-title', 'data-toggleclass'],
        flags: ['panel', 'editable'],
        constructor() {
            const t = this;
            t._list = t.template.querySelector('.list');
            t._editor = t.template.querySelector('.editor');
            t._icon = t.template.querySelector('webui-icon');
            // A drawer may cancel the clicks inside it, which would stop a color input from opening its picker.
            t._editor.addEventListener('click', ev => ev.stopPropagation());
            t.addEventListener('click', ev => {
                if (t.hasAttribute('panel')) return;
                t.open();
            });
            t.addEventListener('keydown', ev => {
                if (t.hasAttribute('panel')) return;
                if (ev.key !== 'Enter' && ev.key !== ' ') return;
                ev.preventDefault();
                t.click();
            });
        },
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'dataToggleclass':
                    t._drawer = (value || '').split('|')[0];
                    break;
            }
        },
        connected() {
            const t = this;
            if (t.hasAttribute('panel')) {
                t.render();
                return;
            }
            // The button opens a list of themes, so keyboard users need it to work as a button too.
            if (!t.hasAttribute('role')) t.setAttribute('role', 'button');
            if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '0');
            if (!t.hasAttribute('aria-label')) t.setAttribute('aria-label', t.getAttribute('title') || 'Choose a theme');
            // An app may set the saved theme after the page starts, as Task Proxy does from its own saved data.
            t.dataset.subscribe = `${DATA_KEY}:onSavedTheme|${COLORS_KEY}:onSavedColors`;
            t.applySaved();
        },
        /** Applies the saved theme, or the default when the site no longer offers it, with its adjusted colors. */
        applySaved() {
            const t = this;
            const saved = webui.getData(DATA_KEY);
            const known = themeOptions(t).map(o => o.value);
            let theme = typeof saved === 'string' ? saved : currentTheme();
            // A theme the site no longer offers falls back to the default.
            if (known.length && !known.includes(theme)) theme = '';
            if (theme !== currentTheme() || (typeof saved === 'string' && saved !== theme)) applyTheme(theme);
            else {
                applyColors(theme);
                syncThemeColor();
            }
        },
        onSavedTheme(value) {
            if (typeof value !== 'string' || value === currentTheme()) return;
            this.applySaved();
        },
        onSavedColors(value) {
            // The change this page just saved is already on the page.
            if (JSON.stringify(value ?? null) === lastSaved) return;
            clearTimeout(saveTimer);
            pending = null;
            applyColors(currentTheme());
            syncThemeColor();
            renderPanels();
        },
        /** Shows the list of themes in the drawer named by data-toggleclass, or in a dialog when there is none. */
        open() {
            const t = this;
            const title = t.dataset.title || t.getAttribute('title') || 'Theme';
            const panel = webui.create('webui-theme-selector', { panel: '' });
            if (t.hasAttribute('editable')) panel.setAttribute('editable', '');
            t.querySelectorAll(':scope > option').forEach(option => panel.appendChild(option.cloneNode(true)));
            const drawer = t._drawer ? document.querySelector(t._drawer) : null;
            if (!drawer) {
                webui.dialog({ title, content: panel, confirm: 'Close' }).catch(() => { });
                return;
            }
            const showingThemes = drawer.classList.contains('open') && !!drawer.querySelector('webui-theme-selector[panel]');
            const header = webui.create('header', { slot: 'header', text: title });
            header.style.padding = 'var(--padding)';
            const section = webui.create('section');
            section.style.padding = 'var(--padding)';
            section.appendChild(panel);
            drawer.replaceChildren(header, section);
            // The loader toggles the drawer for data-toggleclass after this handler runs. Keep it open unless it
            // was already showing the themes, so the button switches the drawer over from other content.
            setTimeout(() => drawer.classList.toggle('open', !showingThemes));
        },
        themeButton(option, current) {
            const button = webui.create('button', {
                type: 'button',
                'aria-pressed': option.value === current ? 'true' : 'false',
                'data-theme-value': option.value,
                click: () => applyTheme(option.value),
            });
            const swatches = webui.create('span', { class: 'swatches', 'aria-hidden': 'true' });
            option.colors.forEach(color => {
                const swatch = webui.create('span', { class: 'swatch' });
                swatch.style.background = color;
                swatches.appendChild(swatch);
            });
            button.append(swatches, webui.create('span', { class: 'name', text: option.name }));
            return button;
        },
        /** Draws one button for each theme, marking the one in use, in groups when the themes say light or dark. */
        render() {
            const t = this;
            if (!t.hasAttribute('panel')) return;
            const current = currentTheme();
            const options = themeOptions(t);
            if (options.some(option => option.scheme)) {
                const groups = SCHEMES.map(([scheme, label]) => [label, options.filter(option => option.scheme === scheme)]);
                groups.push(['Other', options.filter(option => !SCHEMES.some(([scheme]) => scheme === option.scheme))]);
                t._list.replaceChildren(...groups.filter(([, items]) => items.length).map(([label, items]) => {
                    const group = webui.create('div', { class: 'group', role: 'group', 'aria-label': `${label} themes` });
                    group.append(webui.create('span', { class: 'heading', text: label }), ...items.map(option => t.themeButton(option, current)));
                    return group;
                }));
            } else {
                t._list.replaceChildren(...options.map(option => t.themeButton(option, current)));
            }
            t.renderEditor(options.find(option => option.value === current));
        },
        /** The color inputs of an editable selector, showing the colors the page uses now. */
        renderEditor(theme) {
            const t = this;
            if (!t.hasAttribute('editable')) {
                t._editor.replaceChildren();
                return;
            }
            const heading = webui.create('span', { class: 'heading', text: 'Adjust colors' });
            const note = webui.create('p', { class: 'note', text: `Changes apply to the ${theme?.name || 'current'} theme. Text on each color switches between white and black to stay readable.` });
            const rows = EDITABLE.map(([name, label]) => {
                const id = `theme-color-${name}`;
                const input = webui.create('input', { type: 'color', id, name });
                input.value = toHex(resolveColor(`var(--color-${name})`) || [0, 0, 0]);
                input.addEventListener('input', () => setColor(name, input.value, false));
                input.addEventListener('change', () => setColor(name, input.value, true));
                const row = webui.create('label', { class: 'color', for: id });
                row.append(webui.create('span', { text: label }), input);
                return row;
            });
            t._reset = webui.create('button', {
                type: 'button',
                class: 'reset',
                text: `Reset ${theme?.name || 'theme'} colors`,
                click: () => {
                    const colors = JSON.parse(JSON.stringify(savedColors()));
                    delete colors[currentTheme()];
                    saveColors(colors, true);
                    applyColors(currentTheme());
                    syncThemeColor();
                    renderPanels();
                },
            });
            t._editor.replaceChildren(heading, note, ...rows, t._reset);
            t.showReset();
        },
        /** Reset shows only while the theme in use has adjusted colors. */
        showReset() {
            const t = this;
            if (!t._reset) return;
            const colors = savedColors();
            t._reset.hidden = !Object.keys(colors[currentTheme()] || {}).length;
        },
        shadowTemplate: `
<webui-icon class="trigger" icon="palette" fill></webui-icon>
<div class="list" role="group" aria-label="Themes"></div>
<div class="editor"></div>
<style type="text/css">
:host {
display: inline-flex;
cursor: pointer;
padding: 1px;
align-items: center;
justify-content: center;
}
:host([panel]) {
display: block;
cursor: auto;
padding: 0;
}
:host([panel]) .trigger,
:host(:not([panel])) .list,
:host(:not([panel])) .editor,
:host(:not([editable])) .editor {
display: none;
}
.list,
.group,
.editor {
display: flex;
flex-direction: column;
gap: calc(var(--padding, 1em) * 0.75);
}
.list {
gap: calc(var(--padding, 1em) * 1.25);
}
.editor {
margin-top: calc(var(--padding, 1em) * 1.5);
}
.heading {
font-weight: bold;
}
.note {
margin: 0;
opacity: 0.85;
}
.color {
display: flex;
align-items: center;
justify-content: space-between;
gap: var(--padding, 1em);
}
.color input {
width: 3em;
height: 2em;
padding: 0;
border: 1px solid rgb(127 127 127 / 60%);
border-radius: var(--corners, 4px);
background: none;
cursor: pointer;
}
.color input:focus-visible {
outline: var(--focus-outline, 2px solid currentColor);
outline-offset: var(--focus-offset, 2px);
}
button {
display: flex;
align-items: center;
gap: var(--padding, 1em);
width: 100%;
padding: var(--padding, 0.5em);
border: 2px solid transparent;
border-radius: var(--corners, 4px);
background: var(--color-primary, #444);
color: var(--color-primary-offset, #fff);
font: inherit;
text-align: left;
cursor: pointer;
}
button:hover {
border-color: var(--color-primary-offset, #fff);
}
button[aria-pressed="true"] {
border-color: var(--color-active, currentColor);
}
button[aria-pressed="true"]::after {
content: "\\2713";
margin-left: auto;
color: var(--color-active, currentColor);
font-weight: bold;
}
button:focus-visible {
outline: var(--focus-outline, 2px solid currentColor);
outline-offset: var(--focus-offset, 2px);
}
button.reset {
justify-content: center;
background: var(--color-secondary, #444);
color: var(--color-secondary-offset, #fff);
}
button.reset[hidden] {
display: none;
}
.swatches {
display: inline-flex;
flex: 0 0 auto;
}
.swatch {
width: 1.4em;
height: 1.4em;
border-radius: 50%;
border: 1px solid rgb(127 127 127 / 60%);
}
.swatch + .swatch {
margin-left: -0.4em;
}
</style>
`
    });
}
