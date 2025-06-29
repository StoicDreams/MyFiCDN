"use strict"
{
    const content = `
`;
    webui.define("webui-site-settings", {
        content: true,
        linkCss: false,
        watchVisibility: false,
        isInput: false,
        preload: 'input-range',
        constructor: (t) => {
        },
        connected: function (t) {
            t.setupComponent();
        },
        disconnected: function (t) { },
        reconnected: function (t) { },
        setupComponent: function () {
            const t = this;
            t.innerHTML = webui.parseWebuiMarkdown(content);
        }
    });
}
