/*!
 * Web UI Next Page - https://webui.stoicdreams.com/components#next-page
 * A component for displaying a button to navigate to the next page within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
webui.define("webui-next-page", {
    constructor: (t) => {
        t._preContent = webui.create("webui-flex", { class: "next-page-pre" });
        t._link = webui.create("webui-flex", { class: "next-page-link" });
        t._postContent = webui.create("webui-flex", { class: "next-page-post" });
        t.name = "Next Page";
        t.icon = 'arrow|backing|shape:circle';
        t.family = 'regular';
        t.appendChild(t._preContent);
        t.appendChild(t._link);
        t.appendChild(t._postContent);
    },
    attr: ['name', 'href', 'icon'],
    setValue: function (value) {
        const t = this;
        if (!value) {
            value = {};
        }
        t.name = value.name || undefined;
        t.href = value.href || '/';
        t.icon = value.icon || 'arrow|backing|shape:circle';
        t.render();
    },
    render: function () {
        const t = this;
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
                <webui-button class="ma-a" href="${t.href}" end-icon="${t.icon}">
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
        t._preContent.setAttribute('data-subscribe', 'next-page-pre:innerHTML');
        t._link.setAttribute('justify', 'center');
        t._postContent.classList.add('mt-a');
        t._postContent.setAttribute('column', true);
        t._postContent.setAttribute('justify', 'center');
        t._postContent.setAttribute('data-subscribe', 'next-page-post:innerHTML');
        t.render();
    }
});
