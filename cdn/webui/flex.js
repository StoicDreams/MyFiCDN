/*!
 * Web UI Flex - https://webui.stoicdreams.com/components#webui-flex
 * A component for creating flexible layouts within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
webui.define('webui-flex', {
    linkCss: true,
    constructor: (t) => {
        t._style = t.template.querySelector('style');
    },
    attr: ['gap', 'grow', 'column', 'align', 'justify', 'wrap-at'],
    attrChanged: (t, _property, _value) => {
        t.setStyles();
    },
    getDim: function (value) {
        if (!value) return '';
        return webui.pxIfNumber(value);
    },
    setStyles: function () {
        const t = this;
        let a = t.attributes;
        if (!!a.justify) { t.style.justifyContent = `${a.justify.value}`; }
        if (!!a.align) { t.style.alignItems = `${a.align.value}`; }
        if (a.gap && a.gap.value) { t.style.gap = `${t.getDim(t.attributes.gap.value)}`; }
        else { t.style.gap = 'var(--flexgap,var(--padding,1em))'; }
    },
    connected: function (t) {
        const wrapAt = parseInt(t.getAttribute('wrap-at'));
        if (Number.isFinite(wrapAt)) {
            const observer = new ResizeObserver(entries => {
                for (const entry of entries) {
                    const width = entry.contentRect.width;
                    if (width < wrapAt) {
                        t.setAttribute('wrap', '');
                    } else {
                        t.removeAttribute('wrap');
                    }
                }
            });
            observer.observe(t);
            t._wrapObserver = observer;
        }
    },
    disconnected: function (t) {
        if (t._wrapObserver) {
            t._wrapObserver.disconnect();
            t._wrapObserver = null;
        }
    },
    shadowTemplate: `
<slot></slot>
<style type="text/css">
:host {
display: flex!important;
}
:host([grow]) {
flex-grow:1;
}
:host([wrap]) {
flex-wrap:wrap;
}
:host([column]) {
flex-direction:column;
}
</style>
`
});
