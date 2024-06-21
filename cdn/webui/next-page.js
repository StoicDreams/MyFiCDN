/* Display button to navigate to next page */
"use strict"
webui.define("webui-next-page", {
    constructor: (t) => {
        t._preContent = document.createElement("webui-flex");
        t._link = document.createElement("webui-flex");
        t._postContent = document.createElement("webui-flex");
        t.name = "Next Page";
    },
    attr: ['name', 'href'],
    connected: (t) => {
        if (!t.parentNode) { return; }
        t.parentNode.insertBefore(t._preContent, t);
        t.parentNode.insertBefore(t._link, t);
        t.parentNode.insertBefore(t._postContent, t);
        t._preContent.classList.add('mt-a', 'flex-grow');
        t._preContent.setAttribute('column', true);
        t._preContent.setAttribute('align', 'center');
        t._preContent.setAttribute('justify', 'center');
        t._preContent.setAttribute('data-subscribe', 'next-page-pre');
        t._preContent.setAttribute('data-set', 'innerHTML');
        t._link.innerHTML = webui.applyAppDataToContent(`
<webui-button href="${t.href}" theme="info" end-icon="right" end-icon-family="duotone">

Continue to ${t.name}

</webui-button>
`);
        t._link.classList.add('mt-10');
        t._link.setAttribute('column', true);
        t._link.setAttribute('align', 'center');
        t._link.setAttribute('justify', 'center');
        t._postContent.classList.add('mt-a');
        t._postContent.setAttribute('column', true);
        t._postContent.setAttribute('align', 'center');
        t._postContent.setAttribute('justify', 'center');
        t._postContent.setAttribute('data-subscribe', 'next-page-post');
        t._postContent.setAttribute('data-set', 'innerHTML');
    }
});
