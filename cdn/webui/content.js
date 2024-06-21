/* Placeholder page content for pages under construction */
"use strict"
webui.define("webui-content", {
    attr: ["src"],
    connected: (t) => {
        t.fetchContent(t);
    },
    fetchContent: async function (t) {
        if (!t.src) {
            setTimeout(() => t.fetchContent(), 10);
            return;
        }
        try {
            let content = await fetch(t.src);
            if (!content.ok) {
                t.innerHTML = `Failed to load content from ${t.src}`;
                return;
            }
            let body = await content.text();
            if (body.startsWith('<!DOCTYPE')) {
                t.innerHTML = `Source ${t.src} did not return expected markdown/html snippet (Full HTML documents are not allowed by t component)`;
                return;
            }
            let temp = document.createElement('div');
            temp.innerHTML = webui.applyAppDataToContent(body);
            let n = [];
            let p = t.parentNode;
            let b = t;
            if (p.nodeName === 'P') {
                b = p;
                p = p.parentNode;
            }
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
        } catch (ex) {
            t.innerHTML = `Source ${t.src} failed to load:${ex}`;
        }
    }
});
