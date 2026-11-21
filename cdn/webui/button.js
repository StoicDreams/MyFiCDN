/*!
 * Web UI Button - https://webui.stoicdreams.com/components#webui-button
 * A component for displaying buttons.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
/**
 * Two letters standing in for an icon: the first letters of the first two words, or the first two letters of a single
 * word, such as "SK" for Security Key, "RD" for Remote Desktop Connections, and "Pr" for Projects.
 */
function webuiButtonInitials(text) {
    const words = `${text}`.trim().split(/[\s_\-./]+/).filter(Boolean);
    if (!words.length) return '';
    if (words.length > 1) return words.slice(0, 2).map(word => [...word][0].toUpperCase()).join('');
    const letters = [...words[0]];
    return letters[0].toUpperCase() + (letters[1] || '').toLowerCase();
}
webui.define("webui-button", {
    isInput: true,
    constructor() {
        const t = this;
        t._label = t.template.querySelector('slot:not([name])');
        t._startIcon = t.template.querySelector('slot[name="start-icon"]');
        t._endIcon = t.template.querySelector('slot[name="end-icon"]');
        t._initials = t.template.querySelector('.initials');
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
        t.addEventListener('click', ev => {
            // Only <a> follows an href natively. The loader routes paths on this site, so the button opens the rest:
            // other sites, and links with a target or opened with Ctrl or Cmd held.
            const href = t.getAttribute('href');
            if (href && !t.hasAttribute('disabled')) {
                const linkTarget = t.getAttribute('target');
                const external = /^https?:/i.test(href) || href.startsWith('//');
                if (linkTarget && linkTarget !== '_self') {
                    window.open(href, linkTarget, 'noopener');
                } else if (external && (ev.ctrlKey || ev.metaKey)) {
                    window.open(href, '_blank', 'noopener');
                } else if (external) {
                    window.location.assign(href);
                }
            }
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
    flags: ['icon-only'],
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
                t.updateIconOnly();
                break;
            case 'iconOnly':
                t.updateIconOnly();
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
                t.updateIconOnly();
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
                t.updateIconOnly();
                break;
        }
    },
    /** The button's own text, without its icons. */
    labelText() {
        return Array.from(this.childNodes)
            .filter(node => !node.getAttribute?.('slot'))
            .map(node => node.textContent)
            .join(' ').replace(/\s+/g, ' ').trim();
    },
    /**
     * With icon-only, a button shows just its icon. Its text names it instead, as its aria-label, which screen readers
     * read and the tooltip shows. A button without an icon shows two letters of its text in place of one.
     */
    updateIconOnly() {
        const t = this;
        const hasIcon = !!t.querySelector(':scope > [slot="start-icon"], :scope > [slot="end-icon"]');
        const text = t.labelText();
        const collapsed = !!t.iconOnly && (hasIcon || !!text);
        const initials = collapsed && !hasIcon ? webuiButtonInitials(text) : '';
        if (t._initials.textContent !== initials) t._initials.textContent = initials;
        t.toggleAttribute('collapsed', collapsed);
        t.toggleAttribute('initials', !!initials);
        if (t.iconOnly && !t._labelWatch) {
            // Text set later, such as by data, names the button too.
            t._labelWatch = new MutationObserver(() => t.updateIconOnly());
            t._labelWatch.observe(t, { childList: true, characterData: true, subtree: true });
        } else if (!t.iconOnly && t._labelWatch) {
            t._labelWatch.disconnect();
            t._labelWatch = null;
        }
        const own = t.hasAttribute('aria-label') && t.getAttribute('aria-label') !== t._autoLabel;
        if (own) return;
        if (collapsed && text) {
            if (t.getAttribute('aria-label') !== text) t.setAttribute('aria-label', text);
            t._autoLabel = text;
        } else if (t._autoLabel !== undefined) {
            if (t.getAttribute('aria-label') === t._autoLabel) t.removeAttribute('aria-label');
            t._autoLabel = undefined;
        }
    },
    connected() {
        const t = this;
        if (t.dataset.trigger && t.dataset.value === undefined) {
            t.dataset.value = 1;
        }
        t.updateRole();
        t.updateIconOnly();
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
<span class="initials" part="initials" aria-hidden="true"></span>
<slot></slot>
<slot name="end-icon"></slot>
<style type="text/css">
:host {
display: inline-flex;
flex-flow: row;
gap: 0.5em;
align-items: center;
justify-content: center;
text-decoration: none;
padding: var(--button-padding, 0.5em 1em);
border-radius: var(--corners);
font-weight: 500;
min-height: 1em;
-webkit-user-select: text;
user-select: text;
background-color: var(--theme-color);
color: var(--theme-color-offset);
-webkit-user-select: none;
-ms-user-select: none;
user-select: none;
box-shadow: var(--shadow-raised, 0 1px 3px rgb(0 0 0 / 30%));
transition: filter var(--transition-fast, 150ms), transform var(--transition-fast, 150ms);
white-space:nowrap;
}
:host(:not([disabled]):hover) {
filter: brightness(1.12);
}
:host(:not([disabled]):active) {
transform: translateY(1px);
}
:host([collapsed]) slot:not([name]) {
display:none;
}
.initials {
display:none;
}
:host([initials]) .initials {
display:inline-flex;
align-items:center;
justify-content:center;
min-width:1.5em;
height:1.5em;
font-weight:700;
line-height:1;
letter-spacing:0.02em;
}
:host([collapsed]) {
padding:0.5em;
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
opacity: 0.5;
box-shadow: none;
}
:host(:not([disabled])) {
cursor:pointer;
}
:host(:focus-visible) {
outline:var(--focus-outline, 2px solid currentColor);
outline-offset:var(--focus-offset, 2px);
}
</style>
`
});
