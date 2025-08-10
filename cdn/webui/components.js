/*!
 * Web UI Componennts - https://webui.stoicdreams.com
 * Display tabbed sections for all Web UI components.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    const isLocalDev = location.port === '3180';
    const srcRoot = isLocalDev ? '' : 'https://cdn.myfi.ws';
    webui.define("webui-components", {
        content: true,
        watchVisibility: false,
        isInput: false,
        preload: '',
        constructor: (t) => { },
        flags: [],
        attr: ['height', 'max-height'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'height':
                    t.style.height = webui.pxIfNumber(value);
                    break;
                case 'maxHeight':
                    t.style.maxHeight = webui.pxIfNumber(value);
                    break;
            }
        },
        connected: function (t) {
            t.setupComponent();
        },
        disconnected: function (t) { },
        reconnected: function (t) { },
        setupComponent: async function () {
            const t = this;
            t.innerHTML = '';
            let alert = webui.create('webui-alert');
            t.appendChild(alert);
            alert.setValue({ text: 'Loading Components' }, 'info');
            webui.fetchWithCache(`${srcRoot}/webui/components.json`).then(data => {
                data = JSON.parse(data);
                const tabs = webui.create('webui-tabs', { pad: 'var(--padding)', vertical: true, 'transition-timing': 200, 'data-subscribe': 'session-components-tab-index:setTab' });
                data.forEach(component => {
                    let button = webui.create('webui-button', { align: 'left', slot: 'tabs', text: component });
                    tabs.appendChild(button);
                    let content = webui.create('webui-content', { slot: 'content', src: `${srcRoot}/d/en-US/content/components/${component}.md`, cache: true });
                    tabs.appendChild(content);
                });
                alert.remove();
                t.appendChild(tabs);
            }).catch(ex => {
                alert.setValue({ text: `Failed to load components:${ex}` }, 'danger');
            });
        },
    });
}
