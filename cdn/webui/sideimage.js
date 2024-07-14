/* Display side-by-side content where one side is an image */
"use strict"
webui.define("webui-sideimage", {
    constructor: (t) => {
        t._cWrap = webui.create('webui-flex');
        t._content = webui.create('webui-paper');
        t._cWrap.appendChild(t._content);
        t._sideImage = webui.create('img');
        t._imgContainer = webui.create('webui-flex');
    },
    attr: ['elevation', 'reverse', 'src', 'theme', 'alt'],
    attrChanged: (t, property, value) => {
        switch (property) {
            case 'alt':
                t._sideImage.setAttribute('alt', value);
                break;
            case 'src':
                t._sideImage.setAttribute('src', value);
                if (!t._sideImage.hasAttribute('alt')) {
                    t._sideImage.setAttribute('alt', value.split('/').pop());
                }
                break;
            case 'theme':
                t.setTheme(value);
                break;
            case 'reverse':
                t.reverse = true;
                if (t._imgContainer.parentNode && t._cWrap.parentNode) {
                    t.insertBefore(t._imgContainer, t._cWrap);
                }
                break;
        }
    },
    connected: (t) => {
        t.classList.add('side-by-side');
        t._cWrap.setAttribute('column', true);
        t._cWrap.setAttribute('justify', 'center');
        t._cWrap.setAttribute('align', 'center');
        t._content.classList.add('readable-content');
        t.appendChild(t._cWrap);
        t._imgContainer.setAttribute('align', 'center');
        t._imgContainer.setAttribute('justify', 'center');
        t._imgContainer.setAttribute('align', 'center');
        if (t.reverse) {
            t.insertBefore(t._imgContainer, t._cWrap);
        } else {
            t.appendChild(t._imgContainer);
        }
        t._imgContainer.appendChild(t._sideImage);
        setTimeout(() => {
            let r = [];
            t.childNodes.forEach(node => {
                if (node !== t._cWrap && node !== t._imgContainer) {
                    r.push(node);
                }
            });
            r.forEach(node => {
                node.parentNode.removeChild(node);
                t._content.appendChild(node);
            });
        }, 100);
    }
});
