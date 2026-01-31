/*!
 * Web UI Card - https://webui.stoicdreams.com/components#webui-card
 * A component for displaying a card element.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
webui.define("webui-card", {
    constructor() {
        const t = this;
    },
    attr: ['name', 'theme', 'width', 'avatar', 'link', 'elevation'],
    attrChanged(property, value) {
        const t = this;
        t.buildHeader();
    },
    buildHeader() {
        const t = this;
        if (!t._header) {
            t._header = t.querySelector('slot[name="header"]');
            if (!t._header) {
                t._header = webui.create('header');
                t._header.setAttribute('slot', 'header');
            }
        }

        t._header.className = `theme-${t.theme || 'title'}`;
        t._header.innerHTML = '';
        if (t.avatar) {
            let a = webui.create('webui-avatar');
            a.setAttribute('src', t.avatar);
            t._header.appendChild(a);
        }
        if (t.width) {
            t.style.maxWidth = `${t.width}px`;
            t.style.minWidth = `${(t.width * 0.7)}px`;
        }
        let n = webui.create('section');
        n.classList.add('flex-grow');
        t._header.appendChild(n);
        n.innerHTML = `${t.name || ''}`;
        if (t.link) {
            let l = webui.create('a');
            l.setAttribute('href', t.link);
            t._header.appendChild(l);
            let li = webui.create('webui-icon');
            l.appendChild(li);
            li.setAttribute('icon', 'arrow-corner-from-square');
        }
        // JS Bug? Timeout needed or else header does not show up when loading after page navigation.
        setTimeout(() => {
            t.appendChild(t._header);
        }, 1);
    },
    connected() {
        const t = this;
        t.classList.add('elevation-10');
    },
    disconnected() {
        const t = this;
        t.innerHTML = '';
        if (t._header) {
            t._header.remove();
        }
        t.remove();
    },
    shadowTemplate: `
<slot name="header"></slot>
<slot></slot>
<style type="text/css">
:host {
background-color:color-mix(in srgb, var(--theme-color, inherit) 50%, black);
color:var(--theme-color-offset, inherit);
}
slot:not([name]) {
display:flex;
flex-direction:column;
grid-gap:var(--padding);
padding:var(--padding);
}
</style>
`
});
