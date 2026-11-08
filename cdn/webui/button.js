/*!
 * Web UI Button - https://webui.stoicdreams.com/components#webui-button
 * A component for displaying buttons.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
webui.define("webui-button", {
    isInput: true,
    constructor() {
        const t = this;
        t._label = t.template.querySelector('slot:not([name])');
        t._startIcon = t.template.querySelector('slot[name="start-icon"]');
        t._endIcon = t.template.querySelector('slot[name="end-icon"]');
        // Keyboard users press it with Enter or Space, as they would a native button.
        t.addEventListener('keydown', ev => {
            if (t.hasAttribute('disabled') || ev.target !== t) return;
            if (ev.key === 'Enter') {
                ev.preventDefault();
                t.click();
            } else if (ev.key === ' ' && t.getAttribute('role') !== 'link') {
                // Space presses on release, and must not scroll the page.
                ev.preventDefault();
                t._spacePressed = true;
            }
        });
        t.addEventListener('keyup', ev => {
            if (ev.key !== ' ' || !t._spacePressed) return;
            t._spacePressed = false;
            if (!t.hasAttribute('disabled')) t.click();
        });
        t.addEventListener('click', _ => {
            if (t.getAttribute('type') === 'submit' || t.hasAttribute('submit')) {
                t.internals_.form?.requestSubmit();
            }
            if (t.dataset.transfer) {
                t.dataset.transfer.split('|').forEach(ft => {
                    let fts = ft.split(':');
                    let data = webui.getData(fts[0]);
                    if (fts.length === 2) {
                        webui.setData(fts[1], data);
                        return;
                    }
                    webui.setData(fts[0], t.dataset.value);
                });
            }
            if (t.dataset.clear) {
                t.dataset.clear.split('|').forEach(tc => {
                    webui.setData(tc, undefined);
                });
            }
            if (t.dataset.removeItem) {
                let ds = t.dataset.removeItem.split(':');
                if (ds.length === 2) {
                    let data = webui.getData(ds[0]);
                    if (data === undefined || data === null) return;
                    if (typeof data.splice === 'function') {
                        data.splice(ds[1], 1);
                    } else if (data[ds[1]] !== undefined) {
                        delete data[ds[1]];
                    }
                    webui.setData(ds[0], data);
                }
            }
        });
    },
    attr: ['label', 'align', 'href', 'start-icon', 'end-icon', 'start-icon-class', 'end-icon-class', 'elevation', 'submit', 'disabled'],
    attrChanged(property, value) {
        const t = this;
        switch (property) {
            case 'disabled':
            case 'href':
                t.updateRole();
                break;
            case 'label':
                Array.from(t.childNodes).forEach(node => {
                    if (node.nodeName === '#text' || (node.hasAttribute && !node.hasAttribute('slot'))) {
                        node.remove();
                    }
                });
                t.appendChild(webui.create('span', { html: value }));
                break;
            case 'startIconClass':
            case 'startIcon':
                {
                    t.querySelectorAll('[slot="start-icon"]').forEach(n => n.remove());
                    if (!t.startIcon) break;
                    let ico = webui.create('webui-icon');
                    ico.setAttribute('slot', 'start-icon');
                    ico.setAttribute('icon', t.startIcon);
                    if (t.startIconClass) {
                        ico.className = t.startIconClass;
                    }
                    t.appendChild(ico);
                }
                break;
            case 'endIconClass':
            case 'endIcon':
                {
                    t.querySelectorAll('[slot="end-icon"]').forEach(n => n.remove());
                    if (!t.endIcon) break;
                    let ico = webui.create('webui-icon');
                    ico.setAttribute('slot', 'end-icon');
                    ico.setAttribute('icon', t.endIcon);
                    if (t.endIconClass) {
                        ico.className = t.endIconClass;
                    }
                    t.appendChild(ico);
                }
                break;
        }
    },
    connected() {
        const t = this;
        if (t.dataset.trigger && t.dataset.value === undefined) {
            t.dataset.value = 1;
        }
        t.updateRole();
    },
    /** Screen readers hear a button, or a link when it has an href, and keyboard users can reach it unless it is disabled. */
    updateRole() {
        const t = this;
        if (!t.isConnected) return;
        // A tabindex set on the element is kept. Checked before this sets one, since attributes can change before connected runs.
        if (t._ownTabindex === undefined) t._ownTabindex = t.hasAttribute('tabindex');
        // A role set by the page or another component is kept.
        if (!t.hasAttribute('role') || t.getAttribute('role') === t._autoRole) {
            t._autoRole = t.hasAttribute('href') ? 'link' : 'button';
            t.setAttribute('role', t._autoRole);
        }
        const disabled = t.hasAttribute('disabled');
        if (disabled) t.setAttribute('aria-disabled', 'true');
        else t.removeAttribute('aria-disabled');
        if (!t._ownTabindex) t.setAttribute('tabindex', disabled ? '-1' : '0');
    },
    shadowTemplate: `
<slot name="start-icon"></slot>
<slot></slot>
<slot name="end-icon"></slot>
<style type="text/css">
:host {
--theme-shadow-blur:var(--box-shadow-blur, 2px);
display: inline-flex;
flex-flow: row;
gap: 0.5em;
align-items: center;
justify-content: center;
text-decoration: none;
padding: calc(1 * var(--padding)) calc(2 * var(--padding));
border-radius: var(--corners);
min-height: 1em;
-webkit-user-select: text;
user-select: text;
background-color: color-mix(in srgb, var(--theme-color) 90%, black);
color: var(--theme-color-offset);
-webkit-user-select: none;
-ms-user-select: none;
user-select: none;
box-shadow:inset 1px 1px var(--theme-shadow-blur) rgba(255,255,255,0.5), inset -1px -1px var(--theme-shadow-blur) rgba(0,0,0,0.5), 1px 1px var(--theme-shadow-blur) rgba(0,0,0,0.5);
white-space:nowrap;
}
:host([wrap]) {
white-space:wrap;
}
:host([align="left"]) {
justify-content:start;
}
:host([align="right"]) {
justify-content:end;
}
:host([disabled]) {
pointer-events:none;
background-color: color-mix(in srgb, var(--theme-color) 50%, #888888);
color: color-mix(in srgb, var(--theme-color-offset) 50%, #888888);
box-shadow:inset -1px -1px var(--box-shadow-blur) rgba(255,255,255,0.5), inset 1px 1px var(--box-shadow-blur) rgba(0,0,0,0.5);
}
:host(:not([disabled])) {
cursor:pointer;
}
:host(:focus-visible) {
outline:2px solid var(--color-focus, currentColor);
outline-offset:2px;
}
</style>
`
});
