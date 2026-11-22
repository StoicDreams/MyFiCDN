/*!
 * Web UI Link - https://webui.stoicdreams.com/components#webui-link
 * A component for displaying and managing links within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
webui.define('webui-link', {
    constructor() {
        const t = this;
        t._startIcon = t.template.querySelector('slot[name="start-icon"]');
        t._endIcon = t.template.querySelector('slot[name="end-icon"]');
    },
    attr: ['href', 'target', 'icon', 'start-icon', 'end-icon'],
    /**
     * Makes the link reachable by keyboard and named for screen readers: a link with an href, or a button when it only
     * runs a data-trigger or onclick. A role or tabindex the page sets is kept.
     */
    setKeyboard() {
        const t = this;
        const role = t.hasAttribute('href') ? 'link' : (t.hasAttribute('data-trigger') || t.hasAttribute('onclick')) ? 'button' : '';
        if (t._role !== undefined && t.getAttribute('role') === t._role) t.removeAttribute('role');
        if (t._tabbed && t.getAttribute('tabindex') === '0') t.removeAttribute('tabindex');
        t._role = undefined;
        t._tabbed = false;
        if (!role) return;
        if (!t.hasAttribute('role')) {
            t.setAttribute('role', role);
            t._role = role;
        }
        if (!t.hasAttribute('tabindex')) {
            t.setAttribute('tabindex', '0');
            t._tabbed = true;
        }
    },
    attrChanged(property, value) {
        const t = this;
        switch (property) {
            case 'href':
                if (t.isConnected) t.setKeyboard();
                break;
            case 'icon':
            case 'startIcon':
                {
                    t.querySelectorAll('[slot="start-icon"]').forEach(n => n.remove());
                    if (!value) break;
                    let ico = webui.create('webui-icon');
                    ico.setAttribute('slot', 'start-icon');
                    ico.setAttribute('icon', value);
                    t.appendChild(ico);
                }
                break;
            case 'endIcon':
                {
                    t.querySelectorAll('[slot="end-icon"]').forEach(n => n.remove());
                    if (!value) break;
                    let ico = webui.create('webui-icon');
                    ico.setAttribute('slot', 'end-icon');
                    ico.setAttribute('icon', value);
                    t.appendChild(ico);
                }
                break;
        }
    },
    connected() {
        const t = this;
        t.setKeyboard();
        // Enter follows a link, and Enter or Space presses a button, as they do on the real elements.
        t.addEventListener('keydown', ev => {
            if (ev.target !== t || ev.altKey || ev.ctrlKey || ev.metaKey) return;
            const role = t.getAttribute('role');
            if (ev.key === 'Enter' || (ev.key === ' ' && role === 'button')) {
                ev.preventDefault();
                t.click();
            }
        });
        t.addEventListener('click', _ => {
            if (t.href) {
                if (t.target) {
                    window.open(t.href, t.target);
                } else if (t.href[0] === '/') {
                    webui.navigateTo(t.href);
                } else {
                    window.location.href = t.href;
                }
            }
        });
    },
    shadowTemplate: `
<style type="text/css">
:host {
display: inline-flex;
flex-flow: row;
gap: 0.5em;
align-items: center;
text-decoration: underline;
padding: 0;
border:none;
font-size:inherit;
font:inherit;
-webkit-user-select: text;
user-select: text;
color:var(--theme-color-offset, inherit);
}
:host([href]:not(:disabled)),
:host([data-trigger]:not(:disabled)),
:host([onclick]:not(:disabled)) {
cursor:pointer;
}
:host(:focus-visible) {
outline:var(--focus-outline);
outline-offset:var(--focus-offset);
}
</style>
<slot name="start-icon"></slot>
<slot></slot>
<slot name="end-icon"></slot>
`
});
