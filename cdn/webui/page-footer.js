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
        // The copyright fills the room beside Powered by, centered in it. Its flex basis is 0, so the footer only
        // moves Powered by to its own line when even the copyright's longest part does not fit beside it; until
        // then the copyright wraps between its two parts, beside Powered by.
        t._copyright = webui.create('webui-paper', { style: 'flex:1 1 0;white-space:normal;text-align:center;' });
        t._footer.appendChild(t._copyright);
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
        const years = year < currentYear ? `${year}-${currentYear}` : `${currentYear}`;
        const part = text => webui.create('span', { text, style: 'white-space:nowrap;' });
        t._copyright.replaceChildren(part(`© ${years} ${company}`.trim()), ' ', part('All Rights Reserved'));
    }
});
