/*!
 * Web UI Emoji - https://webui.stoicdreams.com/components#webui-emoji
 * A component for displaying and managing emojis within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    const emojiMapUrl = "https://cdn.myfi.ws/i/emojis.json";
    let emojiMap = {};
    let isLoaded = false;
    setTimeout(async () => {
        try {
            const response = await fetch(emojiMapUrl);
            emojiMap = await response.json();
        } catch (err) {
            console.error("Failed to load emoji map:", err);
        }
        isLoaded = true;
    }, 10);
    webui.define("webui-emoji", {
        content: true,
        watchVisibility: false,
        isInput: false,
        preload: '',
        constructor: (t) => { },
        flags: [],
        attr: ['height', 'max-height', 'emoji'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'emoji':
                    t.render();
                    break;
                case 'height':
                    t.style.height = webui.pxIfNumber(value);
                    break;
                case 'maxHeight':
                    t.style.maxHeight = webui.pxIfNumber(value);
                    break;
            }
        },
        render: function () {
            const t = this;
            if (!t.emoji) return;
            if (!isLoaded) {
                setTimeout(() => { t.render(); }, 100);
                return;
            }
            if (!emojiMap[t.emoji]) {
                return;
            }
            t.innerHTML = emojiMap[t.emoji];
        },
        connected: function (t) {
            t.render();
        },
    });
}
