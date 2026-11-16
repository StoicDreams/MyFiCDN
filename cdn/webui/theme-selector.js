/*!
 * Web UI Theme Selector - https://webui.stoicdreams.com/components#webui-theme-selector
 * A header button that lets visitors choose between the site's themes, and remembers their choice.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    // The loader reads this key on startup and sets data-theme before the page draws, so a saved theme never flashes the default.
    const DATA_KEY = 'session-theme';

    function currentTheme() {
        return document.documentElement.dataset.theme || '';
    }

    function syncThemeColor() {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) return;
        const background = getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim();
        if (background && meta.getAttribute('content') !== background) meta.setAttribute('content', background);
    }

    function applyTheme(value) {
        const root = document.documentElement;
        if (value) root.dataset.theme = value;
        else delete root.dataset.theme;
        if (webui.getData(DATA_KEY) !== value) webui.setData(DATA_KEY, value);
        syncThemeColor();
        document.querySelectorAll('webui-theme-selector[panel]').forEach(el => el.render());
    }

    function themeOptions(el) {
        return [...el.querySelectorAll(':scope > option')].map(option => ({
            value: option.value || '',
            name: option.textContent.trim() || option.value || 'Default',
            colors: (option.dataset.colors || '').split(/\s+/).filter(c => c),
        }));
    }

    webui.define('webui-theme-selector', {
        preload: 'icon dialogs',
        attr: ['title', 'data-title', 'data-toggleclass'],
        flags: ['panel'],
        constructor() {
            const t = this;
            t._list = t.template.querySelector('.list');
            t._icon = t.template.querySelector('webui-icon');
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
            const saved = webui.getData(DATA_KEY);
            const known = themeOptions(t).map(o => o.value);
            let theme = typeof saved === 'string' ? saved : currentTheme();
            // A theme the site no longer offers falls back to the default.
            if (known.length && !known.includes(theme)) theme = '';
            if (theme !== currentTheme() || (typeof saved === 'string' && saved !== theme)) applyTheme(theme);
            else syncThemeColor();
        },
        /** Shows the list of themes in the drawer named by data-toggleclass, or in a dialog when there is none. */
        open() {
            const t = this;
            const title = t.dataset.title || t.getAttribute('title') || 'Theme';
            const panel = webui.create('webui-theme-selector', { panel: '' });
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
        /** Draws one button for each theme, marking the one in use. */
        render() {
            const t = this;
            if (!t.hasAttribute('panel')) return;
            const current = currentTheme();
            const items = themeOptions(t).map(option => {
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
            });
            t._list.replaceChildren(...items);
        },
        shadowTemplate: `
<webui-icon class="trigger" icon="palette" fill></webui-icon>
<div class="list" role="group" aria-label="Themes"></div>
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
:host(:not([panel])) .list {
display: none;
}
.list {
display: flex;
flex-direction: column;
gap: calc(var(--padding, 1em) * 0.75);
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
