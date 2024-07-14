/* Display button to navigate to next page */
"use strict"
webui.define("webui-next-page", {
    constructor: (t) => {
        t._preContent = document.createElement("webui-flex");
        t._link = document.createElement("webui-flex");
        t._postContent = document.createElement("webui-flex");
        t.name = "Next Page";
        t.icon = 'right';
        t.family = 'regular';
        t.theme = 'info';
    },
    attr: ['name', 'href', 'icon', 'family', 'theme'],
    setValue: function (value) {
        let t = this;
        if (!value) {
            value = {};
        }
        t.name = value.name || 'Next Page';
        t.href = value.href || '/';
        t.icon = value.icon || 'right';
        t.family = value.family || t.family;
        t.theme = value.theme || t.theme;
        t.render();
    },
    render: function () {
        let t = this;
        t._link.innerHTML = webui.applyAppDataToContent(`
        <webui-button class="ma-a" href="${t.href}" theme="${t.theme}" end-icon="${t.icon}" end-icon-family="${t.family}">
            Continue to ${t.name}
        </webui-button>`);
    },
    connected: (t) => {
        if (!t.parentNode) { return; }
        t.appendChild(t._preContent);
        t.appendChild(t._link);
        t.appendChild(t._postContent);
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
