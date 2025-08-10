/*!
 * Web UI Under Construction - https://webui.stoicdreams.com/components#under-construction
 * Placeholder page content for pages under construction.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
webui.define("webui-under-construction", {
    connected: (t) => {
        let container = webui.create('webui-sideimage');
        container.setAttribute('src', 'https://cdn.myfi.ws/v/Vecteezy/people-are-building-a-spaceship-rocket-cohesive-teamwork-in.svg');
        container.innerHTML = webui.applyAppDataToContent(`
        <webui-flex column data-subscribe="app-under-construction:innerHTML">
            <p>{APP_NAME} <span data-subscribe="domain"></span> is under construction.</p>
        </webui-flex>
        `);
        t.parentNode.insertBefore(container, t);
        t.remove();
    }
});
