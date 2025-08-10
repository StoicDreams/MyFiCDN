/*!
 * Web UI Site Settings - https://webui.stoicdreams.com/components#webui-site-settings
 * A component for managing site settings within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
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
