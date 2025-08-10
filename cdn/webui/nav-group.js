/*!
 * Web UI Nav Group - https://webui.stoicdreams.com/components#webui-nav-group
 * A component for displaying and managing groups of navigation links within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
webui.define('webui-nav-group', {
    preload: 'icon',
    constructor: (t) => {
        t._anchor = webui.create('a');
        t._anchor.classList.add('navlink');
        t._display = webui.create('span');
        t._anchor.appendChild(t._display);
        t._caret = webui.create('webui-icon');
        t._caret.setAttribute('icon', 'caret');
        t._caret.setAttribute('fill', true);
        t._caret.setAttribute('rotate', "180");
        t._anchor.appendChild(t._caret);
        t._anchor.addEventListener('click', ev => {
            if (webui.closest(t, 'webui-drawer')) {
                ev.stopPropagation();
                ev.preventDefault();
            }
            if (t.classList.contains('disabled') || t.getAttribute('disabled')) return;
            t.setShow(!t.open);
        });
    },
    props: {
        'isOpen': {
            get() { return this._anchor.classList.contains('show'); }
        }
    },
    setShow: function (value) {
        let t = this;
        t.open = value;
        t._caret.setAttribute('rotate', t.open ? '0' : '180');
        if (t.open) {
            t._anchor.classList.add('show');
        } else {
            t._anchor.classList.remove('show');
        }
        t.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    },
    flags: ['show'],
    attr: ['icon', 'name'],
    attrChanged: (t, property, value) => {
        switch (property) {
            case 'show':
                t.setShow(value);
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
    connected: (t) => {
        if (t.childNodes[0]) {
            t.insertBefore(t._anchor, t.childNodes[0]);
        } else {
            t.appendChild(t._anchor);
        }
    }
});
