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
        linkCss: true,
        attr: ['label', 'title-on', 'title-off', 'icon', 'icon-on', 'icon-off', 'flags-on', 'flags-off', 'data-enabled', 'enabled', 'theme-on', 'theme-off', 'class'],
        attrChanged(prop, _v) {
            const t = this;
            switch (prop) {
                case '_class':
                    t._button.classList = t.classList;
                    break;
            }
            t.updateElements();
        },
        connected() {
            const t = this;
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
            t._enabled = !!value;
            if (t._enabled) {
                t.removeAttribute('enabled');
            } else {
                t.setAttribute('enabled', true);
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
                    t._enabled = !!el.docked;
                } else {
                    t._recheck = (t._recheck || 0) + 1;
                    setTimeout(() => t.updateElements(), t._recheck * 100);
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
            } else if (!t._enabled) {
                t.removeFlags(flagsOn);
                t.applyFlags(flagsOff);
            }
            t._icon.setAttribute('icon', t._enabled ? t.getIconOn() : t.getIconOff());
            let title = t._enabled ? t.getTitleOn() : t.getTitleOff();
            if (title) {
                t._button.setAttribute('aria-label', title);
                t.setAttribute('title', title);
            }
        },
        shadowTemplate: `
<button><span></span><webui-icon></webui-icon></button>
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
padding:0 var(--padding);
cursor:pointer;
transition: all var(--main-transition, 400ms) ease-in-out;
border-radius:1rem;
line-height:1rem;
}
span:empty {display:none;}
</style>
`
    });
}