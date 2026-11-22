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
    constructor() {
        const t = this;
        t._anchor = webui.create('button');
        t._anchor.classList.add('navlink');
        t._anchor.setAttribute('aria-expanded', 'false');
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
    /** Whether the group is open, read by data-bind="key:setShow". */
    getShow() {
        return !!this.open;
    },
    setShow(value) {
        let t = this;
        const wasOpen = !!t.open;
        // Data such as "false" from storage is text, which would otherwise count as open.
        t.open = value === true || value === 'true' || value === 1 || value === '1';
        t._caret.setAttribute('rotate', t.open ? '0' : '180');
        // Screen readers announce whether the group is open, which the caret only shows visually.
        t._anchor.setAttribute('aria-expanded', t.open ? 'true' : 'false');
        if (t.open) {
            t._anchor.classList.add('show');
        } else {
            t._anchor.classList.remove('show');
        }
        // Only a real change is reported, so data that says the same thing in other words, such as "false", is left as it is.
        if (t.open !== wasOpen) t.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    },
    /** Opens the group when the page being shown is one of its links, so visitors can see where they are. It never closes it. */
    openForPage(value) {
        const t = this;
        const path = !value || value === '/root' ? '/' : value;
        if (t.open) return;
        const links = t.querySelectorAll('webui-nav-link');
        for (const link of links) {
            if (link.getAttribute('url') === path) {
                t.setShow(true);
                return;
            }
        }
    },
    flags: ['show'],
    attr: ['icon', 'name'],
    attrChanged(property, value) {
        const t = this;
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
                webui.setOrRemoveAttribute(t._icon, 'icon', value);
                break;
        }
    },
    connected() {
        const t = this;
        if (t.childNodes[0]) {
            t.insertBefore(t._anchor, t.childNodes[0]);
        } else {
            t.appendChild(t._anchor);
        }
        t.addDataset('subscribe', 'page-path:openForPage');
    }
});
