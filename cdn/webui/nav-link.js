/* Display navigation link */
"use strict"
{
    webui.define('webui-nav-link', {
        linkCss: true,
        preload: 'icon',
        constructor: (t) => {
            t._display = t.template.querySelector('slot:not([name])');
            t._icon = t.template.querySelector('slot[name="icon"]');
            t._anchor = t.template.querySelector('a');
            t._anchor.classList.add('navlink');
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
                    if (value.startsWith('<')) {
                        if (t._webuiIcon && t._webuiIcon.parentNode) {
                            t._webuiIcon.parentNode.removeChild(t._webuiIcon);
                        }
                        t._icon.innerHTML = value;
                        return;
                    } else if (!t._webuiIcon) {
                        t._webuiIcon = document.createElement('webui-icon');
                        t._icon.innerHTML = '';
                        t._icon.appendChild(t._webuiIcon);
                    }
                    t._webuiIcon.setAttribute('icon', value);
                    break;
            }
        },
        connected: (t) => {
            t.setAttribute('data-subscribe', 'page-path:setter');
        },
        shadowTemplate: `
<style type="text/css">
:host {
display:block;
padding:calc(.1 * var(--padding));
}
slot:not([name]) {
display:block;
white-space:nowrap;
}
slot[name="icon"]>svg,
slot[name="icon"]>img,
slot[name="icon"]>*,
:host>*[slot="icon"] {
font-size:inherit;
max-height:4ch;
}
a {
display:flex;
gap:var(--padding);
}
</style>
<a>
<slot name="icon"></slot>
<slot></slot>
</a>
`
    });
}
