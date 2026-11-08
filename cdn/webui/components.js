/*!
 * Web UI Components - https://webui.stoicdreams.com/components#webui-components
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
        preload: 'tabs content alert button',
        constructor() {
            const t = this;
        },
        flags: ['nohash'],
        attr: ['height', 'max-height', 'exclude'],
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'height':
                    t.style.height = webui.pxIfNumber(value);
                    break;
                case 'maxHeight':
                    t.style.maxHeight = webui.pxIfNumber(value);
                    break;
                case 'exclude':
                    // Names to leave out, separated by spaces or commas, such as components a page cannot use.
                    t._exclude = (value || '').split(/[\s,]+/).filter(name => name);
                    if (t._tabs) t.setupComponent();
                    break;
            }
        },
        connected() {
            const t = this;
            // Links in the docs to another component open its tab here, rather than leaving for the components page.
            t.addEventListener('click', ev => {
                const link = ev.target.closest && ev.target.closest('a[href]');
                if (!link || !t.contains(link) || !t._tabs) return;
                const url = new URL(link.getAttribute('href'), location.href);
                if (url.origin !== location.origin || !/\/components\/?$/.test(url.pathname) || !url.hash) return;
                const index = t._names.indexOf(decodeURIComponent(url.hash.substring(1)));
                if (index === -1) return;
                ev.preventDefault();
                ev.stopPropagation();
                if (t.hasAttribute('nohash')) {
                    t._tabs.setTab(index);
                } else {
                    t._tabs.querySelectorAll(':scope > [slot="tabs"]')[index]?.click();
                }
            });
            t.setupComponent();
        },
        disconnected() {
            const t = this;
        },
        reconnected() {
            const t = this;
        },
        setupComponent() {
            const t = this;
            t.innerHTML = '';
            let alert = webui.create('webui-alert');
            t.appendChild(alert);
            alert.setValue({ text: 'Loading Components' }, 'info');
            t._tabs = null;
            const load = t._load = {};
            webui.fetchWithCache(`${srcRoot}/webui/components.json`).then(data => {
                if (load !== t._load) return;
                const exclude = t._exclude || [];
                data = JSON.parse(data).filter(component => !exclude.includes(component));
                t._names = data;
                const tabs = webui.create('webui-tabs', { pad: 'var(--padding)', vertical: true, 'transition-timing': 200, 'data-subscribe': 'session-components-tab-index:setTab' });
                data.forEach(component => {
                    // Without a hash, choosing a tab leaves the url alone, for a page that shows the components as a reference.
                    let button = webui.create('webui-button', { align: 'left', slot: 'tabs', text: component });
                    if (!t.hasAttribute('nohash')) button.setAttribute('hash', component);
                    tabs.appendChild(button);
                    let content = webui.create('webui-content', { slot: 'content', src: `${srcRoot}/d/content/components/${component}.md`, cache: true });
                    tabs.appendChild(content);
                });
                alert.remove();
                t._tabs = tabs;
                t.appendChild(tabs);
            }).catch(ex => {
                if (load !== t._load) return;
                alert.setValue({ text: `Failed to load components:${ex}` }, 'danger');
            });
        },
    });
}
