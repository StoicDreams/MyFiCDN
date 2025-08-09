/*!
 * Web UI Page Not Found - https://webui.stoicdreams.com
 * A component for displaying a "Page Not Found" message within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict";
{
    const defaultTemplate = `
    <webui-data data-page-title="Page Not Found" data-page-subtitle="{PAGE_PATH}">
        <template slot="json" name="page-next-page">
            {
                "name":"Home",
                "href":"/"
            }
        </template>
    </webui-data>
    <webui-side-by-side elevation="10">
        <webui-flex column justify="center" data-subscribe="app-not-found:html">
            <p>The page you are looking for was not found!</p>
        </webui-flex>
        <webui-flex column justify="center">
            <img src="https://cdn.myfi.ws/v/Vecteezy/404-error-illustration-exclusive-design-inspiration.svg" />
        </webui-flex>
    </webui-side-by-side>
    `;
    webui.define('webui-page-not-found', {
        connected: async (t) => {
            if (t.innerHTML) return;
            let html = webui.getData('app-not-found-html');
            if (html) {
                t.innerHTML = webui.trimLinePreTabs(html);
                return;
            }
            t.innerHTML = webui.trimLinePreTabs(defaultTemplate);
        }
    });
}
