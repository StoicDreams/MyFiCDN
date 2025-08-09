/*!
 * Web UI MyFi Dev Settings - https://webui.stoicdreams.com
 * A component for managing MyFi development settings within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
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
