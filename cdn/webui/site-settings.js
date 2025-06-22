"use strict"
{
    const content = `
<webui-input-range name="autosignout" data-subscribe="session-autosignout:setValue" data-trigger="session-autosignout" label="Inactivity Signout" title="Minutes of inactivity to auto-sign-out" min="5" step="5" max="2880"></webui-input-range>
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
