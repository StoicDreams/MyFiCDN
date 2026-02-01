/*!
 * Web UI Emoji - https://webui.stoicdreams.com/components#webui-emoji
 * A component for displaying and managing emojis within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    const emojiSource = webui.getData('appName') === 'My Fidelity CDN' ? '/i/emojis.json' : 'https://cdn.myfi.ws/i/emojis.json';
    let emojiMap = {};
    let isLoaded = false;
    setTimeout(async () => {
        try {
            emojiMap = await webui.fetchWithCache(emojiSource, true);
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
        constructor() {
            const t = this;
        },
        flags: [],
        attr: ['height', 'max-height', 'emoji'],
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'emoji':
                    t.render();
                    break;
                case 'height':
                    t.style.height = webui.pxIfNumber(value);
                    t.style.width = webui.pxIfNumber(value);
                    break;
                case 'maxHeight':
                    t.style.maxHeight = webui.pxIfNumber(value);
                    break;
            }
        },
        render() {
            const t = this;
            t.innerHTML = '';
            if (!t.emoji) return;
            if (!isLoaded) {
                setTimeout(() => { t.render(); }, 100);
                return;
            }
            if (!emojiMap[t.emoji]) {
                console.error("Emoji map is missing %o", t.emoji);
                return;
            }
            t.innerHTML = emojiMap[t.emoji];
        },
        connected() {
            this.render();
        },
        shadowTemplate: `
<slot></slot>
<style type="text/css">
:host {
display:inline-flex;
align-items:center;
justify-content:center;
vertical-align: middle;
container-type:size;
aspect-ratio:1 / 1;
min-height:1.2em;
}
slot {
display: flex;
align-items: center;
justify-content: center;
font-size:70cqmin;
font-family: "Noto Color Emoji";
}
</style>
        `,
    });
}
