/*!
 * Web UI Page Footer - https://webui.stoicdreams.com/components#webui-page-footer
 * A component for displaying the page footer within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
webui.define('webui-page-footer', {
    constructor() {
        const t = this;
        t._footer = webui.create('footer', { slot: 'footer' });
        t.parentNode.appendChild(t._footer);
        t._copyright = webui.create('webui-paper', { class: 'nowrap' });
        t._footer.appendChild(webui.create('webui-flex', { grow: true }));
        t._footer.appendChild(t._copyright);
        t._footer.appendChild(webui.create('webui-flex', { grow: true }));
        t._footer.appendChild(webui.create('webui-poweredby'));
        let cf = t.innerHTML;
        if (cf) {
            t._contentFooter = webui.create('footer', { slot: 'content-footer' });
            t._contentFooter._template = cf;
            t._contentFooter.setValue = (v) => {
                t._contentFooter.innerHTML = webui.applyAppDataToContent(cf);
            }
            t._contentFooter.dataset.subscribe = t.dataset.subscribe || 'app-name';
            t.parentNode.appendChild(t._contentFooter);
            t._contentFooter.innerHTML = webui.applyAppDataToContent(cf);
        }
    },
    attr: ['copyright', 'company'],
    attrChanged(property, value) {
        const t = this;
        switch (property) {
            case 'company':
                t.buildCopyright();
                break;
            case 'copyright':
                t.buildCopyright();
                break;
        }
    },
    connected() {
        const t = this;
        t.remove();
    },
    buildCopyright() {
        const t = this;
        let currentYear = new Date().getFullYear();
        let company = t.company || '';
        let year = parseInt(t.copyright || currentYear);
        if (!year) { year = currentYear; }
        if (year <= (currentYear - 2000)) { year += 2000; }
        if (year < 100) { year += 1900; }
        if (year < currentYear) {
            t._copyright.innerText = `© ${year}-${currentYear} ${company} All Rights Reserved`;
        } else {
            t._copyright.innerText = `© ${currentYear} ${company} All Rights Reserved`;
        }
    }
});
