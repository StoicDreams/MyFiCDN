/*!
 * Web UI App - https://webui.stoicdreams.com/components#app
 * Main layout component.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
webui.define("webui-app", {
    constructor: (t) => {
        webui.setApp(t);
        t.dynstyles = webui.create('style');
        t.dynstyles.setAttribute('type', 'text/css');
        t.headerSlot = t.template.querySelector('slot[name=header]');
        t.contentFooterSlot = t.template.querySelector('slot[name="content-footer"]');
        t.footerSlot = t.template.querySelector('slot[name=footer]');
        t.leftPanelSlot = t.template.querySelector('slot[name=left]');
        t.rightPanelSlot = t.template.querySelector('slot[name=right]');
        t.topPanelSlot = t.template.querySelector('slot[name=top]');
        t.bottomPanelSlot = t.template.querySelector('slot[name=bottom]');
        t.main = t.template.querySelector('main');
        t.mainSlot = t.template.querySelector('main>slot');
        document.head.appendChild(t.dynstyles);
        if (!t.getAttribute('preload')) {
            t.setAttribute('preload', 'dialogs');
        }
        webui.applyDynamicStyles = () => { t.applyDynamicStyles(); };

    },
    attr: ['page-content', 'page-data', 'page-content-encrypt', 'page-data-encrypt', 'root-page', 'content-extension'],
    setPageContent: function (content) {
        this.mainSlot.assignedElements().forEach(node => {
            node.remove();
        });
        let temp = webui.create('div');
        temp.innerHTML = content;
        temp.childNodes.forEach(node => {
            this.appendChild(node);
        });
    },
    attrChanged: (t, property, newValue) => {
        switch (property) {
            case 'rootPage':
                webui._appSettings.rootPage = newValue;
                break;
            case 'contentExtension':
                webui._appSettings.contentExtension = newValue;
                break;
            case 'pageContent':
                appSettings.pageContentEndpoint = newValue;
                break;
            case 'pageData':
                webui._appSettings.pageDataEndpoint = newValue;
                break;
            case 'pageDataEncrypt':
                webui._appSettings.encryptPageData = newValue;
                break;
            case 'pageContentEncrypt':
                webui._appSettings.encryptPageContent = newValue;
                break;
        }
    },
    setBodyClasses: () => {
        let winWidth = window.innerWidth;
        // Flag general width by class
        let w = winWidth > 3800 ? 'w-4k'
            : winWidth > 3400 ? 'w-wqhd'
                : winWidth > 2500 ? 'w-qhd'
                    : winWidth > 1900 ? 'w-fhd'
                        : winWidth > 1500 ? 'w-hdp'
                            : winWidth > 1300 ? 'w-hd'
                                : winWidth > 500 ? 'w-tab'
                                    : 'w-mob'
            ;
        let hasClass = false;
        document.body.classList.forEach(cl => {
            if (cl.startsWith('w-') && cl !== w) {
                document.body.classList.remove(cl);
            } else if (cl === w) {
                hasClass = true;
            }
        });
        if (!hasClass) {
            document.body.classList.add(`${w}`);
        }
    },
    applyDynamicStyles: function () {
        this.setBodyClasses();
        let h = this.getSlot('header') || { clientHeight: 0 };
        let f = this.getSlot('footer') || { clientHeight: 0 };
        let t = this.getSlot('top') || { clientHeight: 0 };
        let r = this.getSlot('right') || { clientWidth: 0 };
        let b = this.getSlot('bottom') || { clientHeight: 0 };
        let l = this.getSlot('left') || { clientWidth: 0 };
        let m = this.shadowRoot.children[2];
        let w = window;
        let wb = document.body;
        let ww = w.innerWidth || wb.clientWidth;
        let wh = w.innerHeight || wb.clientHeight;
        let mw = m.clientWidth;
        let mh = wh - (h.clientHeight + f.clientHeight + t.clientHeight + b.clientHeight);
        let value = `
:root {
--window-width: ${ww}px;
--window-height: ${wh}px;
--main-width: ${mw}px;
--main-height: ${mh}px;
--header-height: ${h.clientHeight}px;
--footer-height: ${f.clientHeight}px;
--drawer-left-width: ${l.clientWidth}px;
--drawer-right-width: ${r.clientWidth}px;
--drawer-top-height: ${t.clientHeight}px;
--drawer-bottom-height: ${b.clientHeight}px;
}
`;
        if (this._adsrCache !== value) {
            this._adsrCache = value;
            this.dynstyles.innerHTML = value;
        }
    },
    _adsrCache: {},
    shadowTemplate: `
<slot name="header"></slot>
<main><slot></slot><slot name="content-footer"></slot></main>
<slot name="footer"></slot>
<slot name="left"></slot>
<slot name="right"></slot>
<slot name="top"></slot>
<slot name="bottom"></slot>
<webui-dialogs></webui-dialogs>
<style type="text/css">
:host {
background-color: var(--color-background, white);
color: var(--color-background-offset, black);
display: grid;
grid-template-columns: min-content auto min-content;
grid-template-rows: min-content min-content auto min-content min-content;
position: fixed;
left: 0;
top: 0;
width: 100%;
height: 100%;
max-width: 100%;
max-height: 100%;
overflow: hidden;
}
::slotted([slot="header"]) {
grid-row: 2;
grid-column: 2;
display: flex!important;
align-items: start;
justify-items: start;
font-size: 1.2rem;
gap:var(--padding, 1em);
padding:var(--padding,1em);
height:min-content;
max-height:min-content;
}
::slotted([slot="footer"]) {
grid-row: 4;
grid-column: 2;
display: flex!important;
font-size: 0.8rem;
align-items:center;
padding:var(--padding, 1em);
vertical-align:middle;
gap:var(--padding, 1em);
height:min-content;
max-height:min-content;
}
::slotted([slot="left"]) {
grid-column: 1;
z-index: 10;
max-height: var(--window-height);
overflow:auto;
}
::slotted([slot="right"]) {
grid-column: 3;
z-index: 11;
max-height: var(--window-height);
overflow:auto;
}
::slotted([slot="bottom"]) {
height:min-content;
grid-row: 5;
z-index: 12;
max-width: var(--window-width);
}
::slotted([slot="top"]) {
height:min-content;
grid-row: 1;
z-index: 13;
max-width: var(--window-width);
}
::slotted([slot="left"]),
::slotted([slot="right"]) {
max-width: calc(0.66 * var(--window-width));
grid-row: 2/5;
display: flex!important;
flex-direction: column;
}
::slotted([slot="top"]),
::slotted([slot="bottom"]) {
max-height: calc(0.5 * var(--window-height));
grid-column: 2;
}
::slotted(:not([slot])) {
}
slot[name="content-footer"] {
display:grid;
gap:var(--padding);
margin-top:calc(5*var(--padding));
padding:var(--padding);
}
main {
display:block;
overflow:auto;
box-sizing:border-box;
height:var(--main-height);
padding:var(--padding,1em);
grid-row: 3;
grid-column: 2;
transition:opacity 0.4s ease-out,
transform 0.4s ease-out;
}
main.transition {
transform:rotateY(90deg);
opacity:0;
}
::-webkit-scrollbar {
width: 1em;
height: 1em;
}
::-webkit-scrollbar-thumb {
background: rgba(90, 90, 90, 0.2);
}
::-webkit-scrollbar-track {
background: rgba(0, 0, 0, 0.2);
}
</style>
`
});
