"use strict"
{
    const content = `
### Coming Soon!
`;
    webui.define("webui-myfi-dev-settings", {
        content: true,
        linkCss: false,
        watchVisibility: false,
        isInput: false,
        preload: '',
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
