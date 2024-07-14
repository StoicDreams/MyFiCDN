/* Display page footer - component is replaced with appropriate footer content. */
"use strict"
webui.define('webui-page-footer', {
    constructor: (t) => {
        t._footer = webui.create('footer', { slot: 'footer' });
        t.parentNode.appendChild(t._footer);
        t._copyright = webui.create('webui-paper');
        t._footer.appendChild(webui.create('webui-flex', { grow: true }));
        t._footer.appendChild(t._copyright);
        t._footer.appendChild(webui.create('webui-flex', { grow: true }));
        t._footer.appendChild(webui.create('webui-poweredby'));
        let cf = t.innerHTML;
        if (cf) {
            t._contentFooter = webui.create('footer', { slot: 'content-footer' });
            t._contentFooter.innerHTML = webui.applyAppDataToContent(cf);
            t.parentNode.appendChild(t._contentFooter);
        }
    },
    attr: ['copyright', 'company'],
    attrChanged: (t, property, _value) => {
        switch (property) {
            case 'company':
                t.buildCopyright();
                break;
            case 'copyright':
                t.buildCopyright();
                break;
        }
    },
    connected: (t) => {
        t.remove();
    },
    buildCopyright: function () {
        let t = this;
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
