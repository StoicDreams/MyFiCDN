/* Display group of navigation links */
"use strict"
webui.define('webui-nav-group', {
    preload: 'icon',
    constructor: (t) => {
        t._anchor = document.createElement('a');
        t._anchor.classList.add('navlink');
        t._display = document.createElement('span');
        t._anchor.appendChild(t._display);
        t._caret = document.createElement('webui-icon');
        t._caret.setAttribute('icon', 'caret-down');
        t._anchor.appendChild(t._caret);
        t._anchor.addEventListener('click', _ev => {
            t.open = !t.open;
            t._caret.setAttribute('icon', t.open ? 'caret-up' : 'caret-down');
            if (t.open) {
                t._anchor.classList.add('show');
            } else {
                t._anchor.classList.remove('show');
            }
        });
    },
    attr: ['icon', 'name'],
    attrChanged: (t, property, value) => {
        switch (property) {
            case 'name':
                t._display.innerHTML = value;
                t._anchor.setAttribute('title', t._display.innerText);
                break;
            case 'icon':
                if (!t._icon) {
                    t._icon = document.createElement('webui-icon');
                    t._anchor.insertBefore(t._icon, t._display);
                }
                t._icon.setAttribute('icon', value);
                break;
        }
    },
    connected: (t) => {
        if (t.childNodes[0]) {
            t.insertBefore(t._anchor, t.childNodes[0]);
        } else {
            t.appendChild(t._anchor);
        }
    }
});
