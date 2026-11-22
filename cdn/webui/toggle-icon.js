/*!
 * Web UI Toggle Icon - https://webui.stoicdreams.com/components#webui-toggle-icon
 * Toggle button that switches icons, title.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    webui.define('webui-toggle-icon', {
        preload: 'icon',
        constructor() {
            const t = this;
            t._button = t.template.querySelector('button');
            t._label = t.template.querySelector('span');
            t._icon = t._button.querySelector('webui-icon');
            t.addEventListener('click', _ev => {
                if (!t.dataset || !t.dataset.enabled) {
                    t.setValue(!t._enabled);
                } else {
                    setTimeout(() => { t.updateElements() }, 10);
                }
            });
        },
                attr: ['label', 'title-on', 'title-off', 'icon', 'icon-on', 'icon-off', 'flags-on', 'flags-off', 'data-enabled', 'enabled', 'theme-on', 'theme-off'],
        attrChanged(prop, _v) {
            const t = this;
            // Attributes change in bursts while an element upgrades, so only update once per burst.
            if (t._updateQueued) return;
            t._updateQueued = true;
            queueMicrotask(() => {
                t._updateQueued = false;
                t.updateElements();
            });
        },
        connected() {
            const t = this;
            // An enabled attribute written in the page starts it on, before anything has set its value.
            if (t._enabled === undefined && t.hasAttribute('enabled')) t._enabled = true;
            t.updateElements();
        },
        props: {
            'value': {
                get() { return this._enabled || false; },
                set(v) { this.setValue(v); }
            }
        },
        setValue(value) {
            const t = this;
            t._enabled = typeof value === 'string' ? value.toLowerCase() === 'true' : !!value;
            if (t._enabled) {
                t.setAttribute('enabled', true);
            } else {
                t.removeAttribute('enabled');
            }
            t.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
            t.updateElements();
        },
        getIconOn: function () { return this.iconOn || this.getAttribute('icon-on') || this.icon || 'toggle-on|fill'; },
        getIconOff: function () { return this.iconOff || this.getAttribute('icon-off') || this.icon || 'toggle-off'; },
        getTitleOn: function () { return this.titleOn || this.getAttribute('title-on') || this.getAttribute('title') || null; },
        getTitleOff: function () { return this.titleOff || this.getAttribute('title-off') || this.getAttribute('title') || null; },
        applyFlags(flags) {
            const t = this;
            if (typeof flags !== 'string') return;
            flags.split(' ').forEach(flag => {
                if (!flag) return;
                t._icon.setAttribute(flag, '1');
            });
        },
        removeFlags(flags) {
            const t = this;
            if (typeof flags !== 'string') return;
            flags.split(' ').forEach(flag => {
                if (!flag) return;
                t._icon.removeAttribute(flag);
            });
        },
        updateElements: function () {
            const t = this;
            if (t.dataset.enabled) {
                let el = document.querySelector(t.dataset.enabled);
                if (el) {
                    // Docked as an attribute is on when present, even empty, as a toggle sets it.
                    t._enabled = !!el.docked || !!el.hasAttribute?.('docked');
                    t.toggleAttribute('enabled', t._enabled);
                } else if ((t._recheck || 0) < 20 && !t._recheckTimer) {
                    t._recheck = (t._recheck || 0) + 1;
                    t._recheckTimer = setTimeout(() => {
                        t._recheckTimer = 0;
                        t.updateElements();
                    }, t._recheck * 100);
                }
            }
            t._label.innerHTML = webui.getDefined(t.label, '');
            let themeOn = t.themeOn || t.getAttribute('theme-on');
            let themeOff = t.themeOff || t.getAttribute('theme-off');
            let activeTheme = t._enabled ? themeOn : themeOff;
            if (activeTheme) {
                t.setAttribute('theme', activeTheme);
            } else {
                t.removeAttribute('theme');
            }
            let iconOn = t.getIconOn();
            let iconOff = t.getIconOff();
            let flagsOn = t.flagsOn || '';
            if (typeof iconOn === 'string' && iconOn.includes('|')) {
                flagsOn += ' ' + iconOn.split('|').slice(1).join(' ');
            }
            let flagsOff = t.flagsOff || '';
            if (typeof iconOff === 'string' && iconOff.includes('|')) {
                flagsOff += ' ' + iconOff.split('|').slice(1).join(' ');
            }
            if (t._enabled) {
                t.removeFlags(flagsOff);
                t.applyFlags(flagsOn);
            } else {
                t.removeFlags(flagsOn);
                t.applyFlags(flagsOff);
            }
            t._icon.setAttribute('icon', t._enabled ? t.getIconOn() : t.getIconOff());
            let title = t._enabled ? t.getTitleOn() : t.getTitleOff();
            if (title) {
                t._button.setAttribute('aria-label', title);
                t.setAttribute('title', title);
            }
            // A title that changes with the state says what pressing does, such as "Dock" and "Hide". Otherwise screen
            // readers are told whether it is on, which only the icon shows.
            if (t.getTitleOn() !== t.getTitleOff()) {
                t._button.removeAttribute('aria-pressed');
            } else {
                t._button.setAttribute('aria-pressed', t._enabled ? 'true' : 'false');
            }
        },
        shadowTemplate: `
<button type="button"><span></span><webui-icon></webui-icon></button>
<style type="text/css">
:host {
display:inline-block;
}
button {
display:flex;
gap: var(--padding, 1em);
font: inherit;
align-items:center;
justify-content: center;
background-color:var(--theme-color, inherit);
color:var(--theme-color-offset, inherit);
border:none;
box-shadow:none;
margin:0;
padding:var(--toggle-icon-padding, 0 var(--padding));
cursor:pointer;
transition: all var(--main-transition, 400ms) ease-in-out;
border-radius:var(--corners-round, 1rem);
line-height:1rem;
}
span:empty {display:none;}
button:focus-visible {
outline:var(--focus-outline, 2px solid currentColor);
outline-offset:var(--focus-offset, 2px);
}
</style>
`
    });
}
