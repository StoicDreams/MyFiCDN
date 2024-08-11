/* Toggle button that switches icons, title */
"use strict"
webui.define('webui-toggle-icon', {
    preload: 'icon',
    constructor: (t) => {
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
    attr: ['label', 'title', 'title-on', 'title-off', 'icon', 'icon-on', 'icon-off', 'flags-on', 'flags-off', 'data-enabled', 'enabled', 'theme-on', 'theme-off'],
    attrChanged: (t, _p, _v) => {
        t.updateElements();
    },
    connected: (t) => {
        t.updateElements();
    },
    props: {
        'value': {
            get() { return this._enabled || false; },
            set(v) { this.setValue(v); }
        }
    },
    setValue(value) {
        let t = this;
        t._enabled = !!value;
        if (t._enabled) {
            t.removeAttribute('enabled');
        } else {
            t.setAttribute('enabled', true);
        }
        t.dispatchEvent(new Event('change', { bubbles: true }));
        t.updateElements();
    },
    getIconOn: function () { return this.iconOn || this.icon || 'toggle-on'; },
    getIconOff: function () { return this.iconOff || this.icon || 'toggle-off'; },
    getTitleOn: function () { return this.titleOn || this.title || null; },
    getTitleOff: function () { return this.titleOff || this.title || null; },
    applyFlags(flags) {
        let t = this;
        if (typeof flags !== 'string') return;
        flags.split(' ').forEach(flag => {
            if (!flag) return;
            t._icon.setAttribute(flag, '1');
        });
    },
    removeFlags(flags) {
        let t = this;
        if (typeof flags !== 'string') return;
        flags.split(' ').forEach(flag => {
            if (!flag) return;
            t._icon.removeAttribute(flag);
        });
    },
    updateElements: function () {
        let t = this;
        if (t.dataset.enabled) {
            t._enabled = !!document.querySelector(t.dataset.enabled);
        }
        t._label.innerHTML = webui.getDefined(t.label, '');
        if (t._enabled && t.themeOn) {
            t.setAttribute('theme', t.themeOn);
        } else if (!t._enabled && t.themeOff) {
            t.setAttribute('theme', t.themeOff);
        }
        if (t._enabled) {
            t.removeFlags(t.flagsOff);
            t.applyFlags(t.flagsOn);
        } else if (!t._enabled) {
            t.removeFlags(t.flagsOn);
            t.applyFlags(t.flagsOff);
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
padding:var(--padding, 1rem);
cursor:pointer;
transition: all var(--main-transition, 400ms) ease-in-out;
}
</style>
`
});
