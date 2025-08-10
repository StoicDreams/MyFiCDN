/*!
 * Web UI Content - https://webui.stoicdreams.com
 * This component is used for dynamically loading and grouping page content to lazy-load content when becoming visible and detaching content when not visible.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
webui.define("webui-content", {
    watchVisibility: true,
    constructor: (t) => {
        t.loadDelay = 300;
        t._storedNodes = null;
        t._fixedHeight = null;
        t._prevInlineHeight = null;
    },
    contentAttached: false,
    linkCss: true,
    attr: ["src", 'load-delay', 'height', 'width'],
    flags: ['cache', 'nodetach', 'nofix', 'preload'],
    attrChanged: (t, property, value) => {
        switch (property) {
            case 'height':
                t.style.height = webui.pxIfNumber(value);
                break;
            case 'width':
                t.style.width = webui.pxIfNumber(value);
                break;
            case 'loadDelay':
                t.loadDelay = parseInt(value) || 0;
                break;
            case 'visible':
                if (t.visible) {
                    t._reattachChildrenIfNeeded();
                } else {
                    t._detachChildrenIfNeeded();
                }
                t.updateContent();
                break;
            case 'src':
                t.setSrc(value);
                break;
        }
    },
    connected: (t) => {
        if (t.innerHTML) {
            if (!t.src) {
                t.src = 'html';
            }
            t._contentLoaded = 'html';
            t.classList.remove('loading');
            t.classList.add('loaded');
        }
        setTimeout(() => t.updateContent(), 10);
    },
    updateContent: function () {
        const t = this;
        if (t.preload) {
            t.fetchContent();
            return;
        }
        if (!t.visible) {
            return;
        }
        setTimeout(() => t.fetchContent(), t.loadDelay);
    },
    setHtml: function (html) {
        const t = this;
        t.src = 'html';
        t._contentLoaded = 'html';
        t.classList.remove('loading');
        t.classList.add('loaded');
        t.innerHTML = html;
        t.contentAttached = true;
    },
    setSrc: function (value) {
        let t = this;
        t.src = value;
        t._contentLoaded = false;
        t.fetchContent();
    },
    loadSrc: async function () {
        const t = this;
        if (!t.src || t.src === 'html') {
            return;
        }
        if (t._contentLoaded && t._contentLoaded === t.src) return;
        t._contentLoaded = t.src;
        try {
            let content = null;
            if (t.cache) {
                content = await webui.fetchWithCache(t.src);
            } else {
                content = await fetch(t.src);
                content = content.ok ? await content.text() : null;
            }
            content = content ? content : `Failed to load content from ${t.src}`;
            if (content.startsWith('<!DOCTYPE')) {
                content = `Source ${t.src} did not return expected markdown/html snippet (Full HTML documents are not allowed by t component)`;
            }
            t._content = content;
        } catch (ex) {
            t._content = `Source ${t.src} failed to load:${ex}`;
        }
    },
    fetchContent: async function () {
        const t = this;
        if (!t.src) {
            return;
        }
        if (!t.visible) {
            if (t.preload) {
                setTimeout(() => {
                    t.loadSrc();
                }, 100);
            }
            return;
        }
        t.classList.add('loading');
        try {
            await t.loadSrc();
            if (t.hasAttribute('slot') || t.hasAttribute('nest')) {
                t.innerHTML = webui.applyAppDataToContent(t._content);
                t.contentAttached = true;
            } else {
                let temp = webui.create('div');
                temp.innerHTML = webui.applyAppDataToContent(t._content);
                let n = [];
                let p = t.parentNode;
                let b = t;
                temp.childNodes.forEach(node => {
                    n.push(node);
                });
                n.forEach(node => {
                    p.insertBefore(node, b);
                });
                if (t.parentNode !== p) {
                    b.remove();
                }
                t.contentAttached = true;
                t.remove();
            }
        } catch (ex) {
            t.innerHTML = `Source ${t.src} failed to load:${ex}`;
            t.contentAttached = true;
        } finally {
            t.classList.remove('loading');
            t.classList.add('loaded');
        }
    },
    _detachChildrenIfNeeded: function () {
        const t = this;
        if (t.nodetach) return;
        if (t._storedNodes) return;
        const hasExplicitHeight = t.nofix || t.hasAttribute("height") ||
            (t.style && t.style.height && t.style.height !== "");
        if (!hasExplicitHeight) {
            const rect = t.getBoundingClientRect();
            t._prevInlineHeight = t.style.height || "";
            t._fixedHeight = Math.round(rect.height);
            if (t._fixedHeight > 0) {
                t.style.height = t._fixedHeight + "px";
            }
        }
        t.contentAttached = false;
        const frag = document.createDocumentFragment();
        while (t.firstChild) {
            frag.appendChild(t.firstChild);
        }
        t._storedNodes = frag;
    },
    _reattachChildrenIfNeeded: function () {
        const t = this;
        if (!t._storedNodes) return;
        t.appendChild(t._storedNodes);
        t.contentAttached = true;
        t._storedNodes = null;
        const hadExplicitHeight = t.nofix || t.hasAttribute("height") ||
            (t._prevInlineHeight && t._prevInlineHeight !== "");
        requestAnimationFrame(() => {
            if (!hadExplicitHeight) {
                t.style.height = t._prevInlineHeight || "";
            }
            t._fixedHeight = null;
            t._prevInlineHeight = null;
        });
    },
    shadowTemplate: `
<slot></slot>
<style type="text/css">
:host {
--scroll-color: color-mix(in srgb, var(--theme-color) 20%, transparent);
--scroll-shadow: -4px 0 -4px rgba(255, 255, 255, 0.2) inset;
}
:host(:not([theme])) {
--theme-color: var(--color-background);
--theme-color-offset: var(--color-background-offset);
}
:host(:not(.loaded)) slot,
:host(:not([visible])) slot {
visibility:hidden;
}
slot {
display:block;
min-width:100%;
min-height:100%;
overflow:auto;
}
::-webkit-scrollbar,
*::-webkit-scrollbar {
background-color: var(--scroll-color);
box-shadow: var(--scroll-shadow);
}
:host(:not(.loaded)) {
display:flex;
flex-direction:column;
gap: var(--padding);
align-items: center;
justify-content: center;
}
:host(:not(.loaded)):before {
content: " ";
display:block;
position: absolute;
animation: spin 1s infinite linear;
border: 2px solid rgba(30, 30, 30, 0.5);
border-left: 4px solid #fff;
border-radius: 50%;
height: 50px;
margin-bottom: 10px;
width: 50px;
top:50px;
}
:host(:not(.loaded).loading):after {
content: 'Loading';
animation: load 2s linear infinite;
}
:host([visible].loaded) {
animation: animation-fadein 300ms ease-in;
}
</style>
`
});
