/*!
 * Web UI YouTube - https://webui.stoicdreams.com/components#webui-youtube
 * A responsive YouTube video, embedded in privacy-enhanced mode.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    const VIDEO_ID = /^[A-Za-z0-9_-]{6,20}$/;
    webui.define('webui-youtube', {
        attr: ['video', 'label', 'start', 'width'],
        constructor() {
            const t = this;
            t._frame = t.template.querySelector('iframe');
        },
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'video':
                case 'start':
                    t.updateSource();
                    break;
                case 'label':
                    t._frame.title = value || 'YouTube video';
                    break;
                case 'width':
                    t.style.maxWidth = webui.pxIfNumber(value) || '';
                    break;
            }
        },
        connected() {
            const t = this;
            if (!t.hasAttribute('label')) t._frame.title = 'YouTube video';
            t.updateSource();
        },
        updateSource() {
            const t = this;
            const id = `${t.getAttribute('video') || ''}`.trim();
            if (!VIDEO_ID.test(id)) {
                t._frame.removeAttribute('src');
                t._frame.hidden = true;
                return;
            }
            const start = parseInt(t.getAttribute('start'));
            const url = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
            if (start > 0) url.searchParams.set('start', start);
            if (t._frame.src !== url.href) t._frame.src = url.href;
            t._frame.hidden = false;
        },
        shadowTemplate: `
<iframe part="video" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen hidden></iframe>
<style type="text/css">
:host {
display: block;
width: 100%;
margin-inline: auto;
}
iframe {
display: block;
width: 100%;
aspect-ratio: 16 / 9;
height: auto;
border: 0;
}
iframe[hidden] {
display: none;
}
</style>
`
    });
}
