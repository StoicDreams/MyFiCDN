/* Toggle button that switches icons, title */
"use strict"
webui.define('webui-toggle-icon', {
    constructor: (t) => {
        t._button = t.template.querySelector('button');
        t._icon = t._button.querySelector('webui-fa');
        t.updateElements();
        t.addEventListener('click', _ev => {
            if (!t.dataset || !t.dataset.enabled) {
                t.enabled = !t.enabled;
                if (t.enabled) {
                    t.removeAttribute('enabled');
                } else {
                    t.setAttribute('enabled', true);
                }
            }
            setTimeout(() => { t.updateElements() }, 10);
        });
    },
    attr: ['title', 'title-on', 'title-off', 'icon', 'icon-on', 'icon-off', 'icon-family', 'icon-family-on', 'icon-family-off', 'data-enabled', 'enabled'],
    attrChanged: (t, _p, _v) => {
        t.updateElements();
    },
    getIconOn: function () { return this.iconOn || this.icon || 'toggle-on'; },
    getIconOff: function () { return this.iconOff || this.icon || 'toggle-off'; },
    getIconFamilyOn: function () { return this.iconFamilyOn || this.iconFamily || 'regular'; },
    getIconFamilyOff: function () { return this.iconFamilyOff || this.iconFamily || 'regular'; },
    getTitleOn: function () { return this.titleOn || this.title || null; },
    getTitleOff: function () { return this.titleOff || this.title || null; },
    updateElements: function () {
        let t = this;
        if (t.dataset.enabled) {
            t.enabled = !!document.querySelector(t.dataset.enabled);
        }
        t._icon.setAttribute('icon', t.enabled ? t.getIconOn() : t.getIconOff());
        t._icon.setAttribute('family', t.enabled ? t.getIconFamilyOn() : t.getIconFamilyOff());
        let title = t.enabled ? t.getTitleOn() : t.getTitleOff();
        if (title) {
            t._button.setAttribute('aria-label', title);
            t.setAttribute('title', title);
        }
    },
    shadowTemplate: `
<style type="text/css">
button {
background-color:transparent;
border:none;
box-shadow:none;
color:inherit;
margin:0;
padding:0;
cursor:pointer;
}
</style>
<button><webui-fa></webui-fa></button>
`
});
