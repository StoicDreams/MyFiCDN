/*!
 * Web UI Nav Link - https://webui.stoicdreams.com/components#webui-nav-link
 * A component for displaying and managing navigation links within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
webui.define('webui-nav-link', {
    preload: 'icon',
    constructor() {
        const t = this;
        t._anchor = webui.create('a');
        t._anchor.classList.add('navlink');
        t._display = webui.create('span');
        t._anchor.appendChild(t._display);
    },
    attr: ['icon', 'name', 'url'],
    setPagePath(value) {
        const t = this;
        if (value === '' || value === '/root') {
            value = '/';
        }
        if (value === t.url) {
            t.classList.add('theme-active');
            t._anchor.setAttribute('disabled', true);
        } else {
            t.classList.remove('theme-active');
            t._anchor.removeAttribute('disabled');
        }
    },
    attrChanged(property, value) {
        const t = this;
        switch (property) {
            case 'url':
                t._anchor.setAttribute('href', value);
                break;
            case 'name':
                t._display.innerHTML = value;
                t._anchor.setAttribute('title', t._display.innerText);
                break;
            case 'icon':
                if (!t._icon) {
                    t._icon = webui.create('webui-icon');
                    t._anchor.insertBefore(t._icon, t._display);
                } else {
                    t._icon.removeAttribute('backing');
                    t._icon.removeAttribute('ban');
                    t._icon.removeAttribute('bordered');
                    t._icon.removeAttribute('fill');
                    t._icon.removeAttribute('inverted');
                    t._icon.removeAttribute('rotate');
                    t._icon.removeAttribute('shade');
                    t._icon.removeAttribute('shape');
                    t._icon.removeAttribute('sharp');
                    t._icon.removeAttribute('stroke');
                    t._icon.removeAttribute('theme');
                }
                t._icon.setAttribute('icon', value);
                break;
        }
    },
    connected() {
        const t = this;
        if (t.innerHTML) {
            t._anchor.innerHTML = t.innerHTML;
            t.innerHTML = '';
        }
        t.appendChild(t._anchor);
        t.addDataset('subscribe', 'page-path:setter');
    }
});
