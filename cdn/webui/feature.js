/*!
 * Web UI Feature - https://webui.stoicdreams.com/components#webui-feature
 * A screenshot or short looping clip beside a heading and text, for showing what a product or project does.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    webui.define('webui-feature', {
        attr: ['src', 'alt', 'video', 'href'],
        flags: ['reverse'],
        constructor() {
            const t = this;
            t._link = t.template.querySelector('a.shot');
            t._img = t.template.querySelector('img');
            t._clip = t.template.querySelector('webui-loop-video');
            t._mediaSlot = t.template.querySelector('slot[name="media"]');
            t._mediaSlot.addEventListener('slotchange', () => t.render());
        },
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'src':
                    t._img.src = value || '';
                    t.render();
                    break;
                case 'alt':
                    t._img.alt = value || '';
                    t.render();
                    break;
                case 'video':
                case 'href':
                    t.render();
                    break;
            }
        },
        connected() {
            this.render();
        },
        /** Shows the slotted media, the clip, or the screenshot, in that order of preference. */
        render() {
            const t = this;
            const src = t.getAttribute('src') || '';
            const alt = t.getAttribute('alt') || '';
            const video = t.getAttribute('video') || '';
            const slotted = t._mediaSlot.assignedElements().length > 0;
            const showClip = !slotted && !!video;
            const showShot = !slotted && !video && !!src;
            t._clip.hidden = !showClip;
            if (showClip) {
                if (t._clip.getAttribute('src') !== video) t._clip.setAttribute('src', video);
                if (src) t._clip.setAttribute('poster', src);
                else t._clip.removeAttribute('poster');
                t._clip.setAttribute('alt', alt);
            } else if (t._clip.hasAttribute('src')) {
                t._clip.removeAttribute('src');
            }
            t._link.hidden = !showShot;
            if (showShot) {
                const href = t.getAttribute('href') || src;
                t._link.href = href;
                t._link.setAttribute('aria-label', href === src
                    ? (alt ? `${alt} (full size)` : 'Full-size screenshot')
                    : (alt || href));
            }
        },
        shadowTemplate: `
<div class="wrap" part="wrap">
<div class="media" part="media">
<slot name="media"></slot>
<a class="shot" part="shot" target="_blank" rel="noopener" hidden><img loading="lazy" decoding="async" alt="" /></a>
<webui-loop-video part="clip" hidden></webui-loop-video>
</div>
<div class="text" part="text"><slot></slot></div>
</div>
<style type="text/css">
:host {
display: block;
container-type: inline-size;
margin-block: calc(var(--padding, 1em) * 2);
}
.wrap {
display: grid;
grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
gap: calc(var(--padding, 1em) * 1.5);
align-items: start;
}
:host([reverse]) .media {
order: 2;
}
.media {
min-width: 0;
}
.text {
min-width: 0;
display: flex;
flex-direction: column;
gap: calc(var(--padding, 1em) * 0.75);
}
[hidden] {
display: none !important;
}
.shot {
display: block;
border-radius: var(--corners, 4px);
overflow: hidden;
box-shadow: 0 4px 18px rgb(0 0 0 / 35%);
}
.shot:focus-visible {
outline: var(--focus-outline, 2px solid currentColor);
outline-offset: var(--focus-offset, 2px);
}
img {
display: block;
width: 100%;
height: auto;
}
webui-loop-video {
box-shadow: 0 4px 18px rgb(0 0 0 / 35%);
border-radius: var(--corners, 4px);
}
::slotted(h2),
::slotted(h3) {
margin-top: 0;
}
@container (max-width: 719px) {
.wrap {
grid-template-columns: minmax(0, 1fr);
gap: calc(var(--padding, 1em) * 0.75);
}
:host([reverse]) .media {
order: 0;
}
}
</style>
`
    });
}
