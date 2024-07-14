/* Display button to navigate to next page */
"use strict"
webui.define("webui-next-page", {
    constructor: (t) => {
        t._preContent = webui.create("webui-flex", { class: "next-page-pre" });
        t._link = webui.create("webui-flex", { class: "next-page-link" });
        t._postContent = webui.create("webui-flex", { class: "next-page-post" });
        t.name = "Next Page";
        t.icon = 'right';
        t.family = 'regular';
        t.theme = 'info';
        t.appendChild(t._preContent);
        t.appendChild(t._link);
        t.appendChild(t._postContent);
        console.log('constructed');
    },
    attr: ['name', 'href', 'icon', 'family', 'theme'],
    setValue: function (value) {
        let t = this;
        if (!value) {
            value = {};
        }
        t.name = value.name || undefined;
        t.href = value.href || '/';
        t.icon = value.icon || 'right';
        t.family = value.family || t.family;
        t.theme = value.theme || t.theme;
        t.render();
    },
    render: function () {
        let t = this;
        if (t._isRendering) return;
        t._isRendering = true;
        let last = t._lastRender || (Date.now() - 1000);
        t._lastRender = Date.now();
        const tw = 300;
        let toWait = Math.min(tw, Math.max(0, tw - (Date.now() - last)));
        if (toWait === 0) {
            toWait = tw;
        }
        setTimeout(() => {
            t._isRendering = false;
            if (!t.name) {
                t._link.innerHTML = '';
                t.style.display = 'none';
                return;
            } else {
                t._link.innerHTML = webui.applyAppDataToContent(`
                <webui-button class="ma-a" href="${t.href}" theme="${t.theme}" end-icon="${t.icon}" end-icon-family="${t.family}">
                    Continue to ${t.name}
                </webui-button>`);
                t.style.display = '';
            }
        }, toWait);
    },
    connected: (t) => {
        t._preContent.classList.add('mt-a', 'flex-grow');
        t._preContent.setAttribute('column', true);
        t._preContent.setAttribute('justify', 'center');
        t._preContent.setAttribute('data-subscribe', 'next-page-pre');
        t._preContent.setAttribute('data-set', 'innerHTML');
        t._link.setAttribute('justify', 'center');
        t._postContent.classList.add('mt-a');
        t._postContent.setAttribute('column', true);
        t._postContent.setAttribute('justify', 'center');
        t._postContent.setAttribute('data-subscribe', 'next-page-post');
        t._postContent.setAttribute('data-set', 'innerHTML');
        t.render();
    }
});
