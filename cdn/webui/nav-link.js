/* Display navigation link */
"use strict"
webui.define('webui-nav-link', {
    preload: 'icon',
    constructor: (t) => {
        t._anchor = webui.create('a');
        t._anchor.classList.add('navlink');
        t._display = webui.create('span');
        t._anchor.appendChild(t._display);
    },
    attr: ['icon', 'name', 'url'],
    setPagePath: function (value) {
        let t = this;
        if (value === '' || value === '/root') {
            value = '/';
        }
        if (value === t.url) {
            t.classList.add('theme-active');
            t._anchor.setAttribute('disabled', true);
        } else {
            t.classList.remove('theme-active');
            t._anchor.removeAttribute('disabled');
        }
    },
    attrChanged: (t, property, value) => {
        switch (property) {
            case 'url':
                t._anchor.setAttribute('href', value);
                break;
            case 'name':
                t._display.innerHTML = value;
                t._anchor.setAttribute('title', t._display.innerText);
                break;
            case 'icon':
                if (!t._icon) {
                    t._icon = webui.create('webui-icon');
                    t._anchor.insertBefore(t._icon, t._display);
                }
                t._icon.setAttribute('icon', value);
                break;
        }
    },
    connected: (t) => {
        if (t.innerHTML) {
            t._anchor.innerHTML = t.innerHTML;
            t.innerHTML = '';
        }
        t.appendChild(t._anchor);
        t.addDataset('subscribe', 'page-path:setter');
    }
});
