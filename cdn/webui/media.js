/*!
 * Web UI Media - https://webui.stoicdreams.com/components#webui-media
 * A small image beside content, such as a photo beside an introduction, that stacks on narrow widths.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    webui.define('webui-media', {
        attr: ['src', 'alt', 'size', 'gap'],
        flags: ['round', 'reverse'],
        constructor() {
            const t = this;
            t._img = t.template.querySelector('img');
        },
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'src':
                    t._img.src = value || '';
                    t._img.hidden = !value;
                    break;
                case 'alt':
                    t._img.alt = value || '';
                    break;
                case 'size':
                    t.style.setProperty('--size', webui.pxIfNumber(value));
                    break;
                case 'gap':
                    t.style.setProperty('--gap', webui.pxIfNumber(value));
                    break;
            }
        },
        connected() {
            const t = this;
            if (!t.hasAttribute('alt')) t._img.alt = '';
            if (!t.hasAttribute('src')) t._img.hidden = true;
        },
        shadowTemplate: `
<div class="media" part="media">
<img part="image" alt="" />
<div class="body" part="body"><slot></slot></div>
</div>
<style type="text/css">
:host {
--size: 160px;
--gap: calc(2 * var(--padding, 1em));
display: block;
container-type: inline-size;
}
.media {
display: flex;
gap: var(--gap);
align-items: flex-start;
}
:host([reverse]) .media {
flex-direction: row-reverse;
}
img {
flex: 0 0 auto;
width: var(--size);
height: var(--size);
object-fit: cover;
}
img[hidden] {
display: none;
}
:host([round]) img {
border-radius: 50%;
}
.body {
flex: 1 1 auto;
min-width: 0;
}
@container (max-width: 480px) {
.media,
:host([reverse]) .media {
flex-direction: column;
align-items: center;
}
.body {
width: 100%;
}
}
</style>
`
    });
}
