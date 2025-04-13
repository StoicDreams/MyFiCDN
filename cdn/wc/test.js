"use strict"
{
    webui.define("app-test", {
        linkCss: true,
        watchVisibility: false,
        isInput: false,
        preload: '',
        constructor: (t) => {
        },
        connected: function (t) {
        },
        disconnected: function () { },
        shadowTemplate: `
<style type="text/css">
:host {
display:flex;
flex-direction:column;
gap:var(--padding);
}
</style>
<webui-input-text label="Testing Nested Shadow-Dom Triggers" data-trigger="test-shadow-value" data-subscribe="test-shadow-value:value"></webui-input-text>
<input type="text" readonly data-subscribe="test-shadow-value:value" />
`
    });
}