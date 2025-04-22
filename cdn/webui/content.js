/* Placeholder page content for pages under construction */
"use strict"
webui.define("webui-content", {
    watchVisibility: true,
    constructor: (t) => {
        t.loadDelay = 300;
    },
    linkCss: true,
    attr: ["src", 'preload', 'load-delay', 'height', 'width'],
    flags: ['cache'],
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
        let t = this;
        if (t.preload) {
            t.fetchContent();
            return;
        }
        if (t.visible) {
            setTimeout(() => t.fetchContent(), t.loadDelay);
        } else {

        }
    },
    setHtml: function(html) {
        t.src = 'html';
        t._contentLoaded = 'html';
        t.classList.remove('loading');
        t.classList.add('loaded');
        t.innerHTML = html;
    },
    setSrc: function(value) {
      let t=this;
      t.src = value;
      t._contentLoaded = false;
      t.fetchContent();
    },
    fetchContent: async function () {
        let t = this;
        if (!t.preload && !t.visible) return;
        if (t._contentLoaded && t._contentLoaded === t.src) return;
        if (!t.src) {
            return;
        }
        t.classList.add('loading');
        t._contentLoaded = t.src;
        try {
            let content = null;
            if (t.cache) {
                content = await webui.fetchWithCache(t.src);
            } else {
                content = await fetch(t.src);
                content = content.ok ? await content.text() : null;
            }

            if (!content) {
                t.innerHTML = `Failed to load content from ${t.src}`;
                return;
            }
            let body = content;
            if (body.startsWith('<!DOCTYPE')) {
                t.innerHTML = `Source ${t.src} did not return expected markdown/html snippet (Full HTML documents are not allowed by t component)`;
                return;
            }
            if (t.hasAttribute('slot') || t.hasAttribute('nest')) {
                t.innerHTML = webui.applyAppDataToContent(body);
            } else {
                let temp = document.createElement('div');
                temp.innerHTML = webui.applyAppDataToContent(body);
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
                t.remove();
            }
        } catch (ex) {
            t.innerHTML = `Source ${t.src} failed to load:${ex}`;
        } finally {
            t.classList.remove('loading');
            t.classList.add('loaded');
        }
    },
    shadowTemplate: `
<slot></slot>
<style type="text/css">
:host {
--scroll-color: color-mix(in srgb, var(--theme-color) 20%, transparent);
--scroll-shadow: -4px 0 -4px rgba(255, 255, 255, 0.2) inset;
}
:host(:not(.loaded)) slot,
:host(:not([visible])) slot {
display:none;
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
animation: spin 1s infinite linear;
border: 2px solid rgba(30, 30, 30, 0.5);
border-left: 4px solid #fff;
border-radius: 50%;
height: 50px;
margin-bottom: 10px;
width: 50px;
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
