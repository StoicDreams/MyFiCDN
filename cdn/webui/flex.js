/*!
 * Web UI Flex - https://webui.stoicdreams.com/components#webui-flex
 * A component for creating flexible layouts within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
webui.define('webui-flex', {
    attr: ['gap', 'grow', 'column', 'align', 'justify', 'wrap-at'],
    attrChanged(property, value) {
        const t = this;
        t.setStyles();
    },
    getDim(value) {
        if (!value) return '';
        return webui.pxIfNumber(value);
    },
    setStyles() {
        const t = this;
        let a = t.attributes;
        if (!!a.justify) { t.style.justifyContent = `${a.justify.value}`; }
        if (!!a.align) { t.style.alignItems = `${a.align.value}`; }
        if (a.gap && a.gap.value) { t.style.gap = `${t.getDim(t.attributes.gap.value)}`; }
        else { t.style.gap = 'var(--flexgap,var(--padding,1em))'; }
    },
    connected() {
        this.watchWrap();
    },
    reconnected() {
        this.watchWrap();
    },
    watchWrap() {
        const t = this;
        if (t._wrapObserver) return;
        const wrapAt = parseInt(t.getAttribute('wrap-at'));
        if (Number.isFinite(wrapAt)) {
            // Wrapping changes this element's own height, so the attribute is set in the next frame, and only when it
            // changes, or the observer reports the change in the same frame as a ResizeObserver loop error.
            const observer = new ResizeObserver(entries => {
                const width = entries[entries.length - 1].contentRect.width;
                const wrap = width < wrapAt;
                cancelAnimationFrame(t._wrapFrame);
                t._wrapFrame = requestAnimationFrame(() => {
                    if (t.hasAttribute('wrap') !== wrap) t.toggleAttribute('wrap', wrap);
                });
            });
            observer.observe(t);
            t._wrapObserver = observer;
        }
    },
    disconnected() {
        const t = this;
        if (t._wrapObserver) {
            t._wrapObserver.disconnect();
            t._wrapObserver = null;
        }
    },
    shadowTemplate: `
<slot></slot>
<style type="text/css">
:host {
display: flex;
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
