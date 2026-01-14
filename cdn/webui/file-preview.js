/*!
 * Web UI File Preview - https://webui.stoicdreams.com/components#webui-file-preview
 * A component for displaying file previews within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    webui.define('webui-file-preview', {
        constructor: (t) => {
            t._iframe = t.template.querySelector('iframe');
            t._img = t.template.querySelector('img');
        },
        attr: ['height', 'max-height'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'height':
                    t.style.height = webui.pxIfNumber(value);
                    t._img.style.width = 'auto';
                    t._img.style.height = webui.pxIfNumber(value);
                    break;
                case 'maxHeight':
                    t.style.maxHeight = webui.pxIfNumber(value);
                    t._img.style.maxHeight = webui.pxIfNumber(value);
                    break;
            }
        },
        setFile: function (files) {
            let t = this;
            if (!files || !files[0] || !files[0].content) {
                t.clear();
                return;
            }
            // TODO, add pagination when multiple files are selected
            let file = files[0];
            t.clear();
            if (file.type.startsWith('image')) {
                t._img.src = file.content;
            } else if (file.content.startsWith('data:')) {
                t._iframe.src = file.content;
            } else {
                t._iframe.srcdoc = file.content;
            }
        },
        clear: function () {
            let t = this;
            t._img.removeAttribute('src');
            t._iframe.removeAttribute('srcdoc');
            t._iframe.removeAttribute('src');
        },
        shadowTemplate: `
<iframe></iframe>
<img alt="File Preview" />
<style type="text/css">
:host {
display:block;
width:100%;
min-height:100px;
box-sizing:border-box;
}
iframe {
display:block;
width:100%;
height:100%;
box-sizing:border-box;
outline:none;
border:none;
}
img {
display:block;
width:100%;
}
iframe:not([src]):not([srcdoc]),
img:not([src]){
display:none;
}
</style>
`
    });
}