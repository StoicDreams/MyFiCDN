/* Display a single card component */
"use strict"
webui.define("webui-card", {
    constructor: (t) => { },
    attr: ['name', 'theme', 'width', 'avatar', 'link', 'elevation'],
    attrChanged: (t, property, value) => {
        t.buildHeader();
    },
    buildHeader: function () {
        let t = this;
        if (!t._header) {
            t._header = t.querySelector('slot[name="header"]');
            if (!t._header) {
                t._header = document.createElement('header');
                t._header.setAttribute('slot', 'header');
            }
        }

        t._header.className = `theme-${t.theme || 'title'}`;
        t._header.innerHTML = '';
        if (t.avatar) {
            let a = document.createElement('webui-avatar');
            a.setAttribute('src', t.avatar);
            t._header.appendChild(a);
        }
        if (t.width) {
            t.style.maxWidth = `${t.width}px`;
            t.style.minWidth = `${(t.width * 0.7)}px`;
        }
        let n = document.createElement('section');
        n.classList.add('flex-grow');
        t._header.appendChild(n);
        n.innerHTML = `${t.name || ''}`;
        if (t.link) {
            let l = document.createElement('a');
            l.setAttribute('href', t.link);
            t._header.appendChild(l);
            let li = document.createElement('webui-fa');
            l.appendChild(li);
            li.setAttribute('icon', 'arrow-up-right-from-square');
        }
        // JS Bug? Timeout needed or else header does not show up when loading after page navigation.
        setTimeout(() => {
            t.appendChild(t._header);
        }, 1);
    },
    connected: (t) => {
        t.classList.add('elevation-10');
    },
    disconnected: (t) => {
        t.innerHTML = '';
        if (t._header) {
            t._header.remove();
        }
        t.remove();
    },
    shadowTemplate: `
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
<slot name="header"></slot>
<slot></slot>
`
});
