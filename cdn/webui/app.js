/*!
 * Web UI App - https://webui.stoicdreams.com/components#webui-app
 * Main layout component.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
webui.define("webui-app", {
    constructor() {
        const t = this;
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
        // The page scrolls inside main, so keyboard users must be able to focus it to scroll pages that have
        // nothing else to focus, such as terms and policies.
        t.main.setAttribute('tabindex', '0');
        t.mainSlot = t.template.querySelector('main>slot');
        document.head.appendChild(t.dynstyles);
        if (!t.getAttribute('preload')) {
            t.setAttribute('preload', 'dialogs');
        }
        webui.applyDynamicStyles = () => { t.applyDynamicStyles(); };
        // Sizes are read when the browser reports a change, right after its own layout, so reading them is free.
        // Measuring at other times forces the browser to lay out the whole page early.
        t._sizeObserver = new ResizeObserver(() => t.measure());
        t._sizeObserver.observe(t.main);
        t.template.querySelectorAll('slot[name]').forEach(slot => {
            slot.addEventListener('slotchange', () => t.observeSlots());
        });
    },
    connected() {
        this.observeSlots();
    },
    /** Watch whatever is in the header, footer, and drawer slots, which can change as drawers are added. */
    observeSlots() {
        const t = this;
        const watched = new Set(['header', 'footer', 'top', 'right', 'bottom', 'left'].map(name => t.getSlot(name)).filter(Boolean));
        (t._watched || new Set()).forEach(el => { if (!watched.has(el)) t._sizeObserver.unobserve(el); });
        watched.forEach(el => { if (!t._watched || !t._watched.has(el)) t._sizeObserver.observe(el); });
        t._watched = watched;
    },
    attr: ['page-content', 'page-data', 'page-content-encrypt', 'page-data-encrypt', 'root-page', 'content-extension'],
    setPageContent(content) {
        this.mainSlot.assignedElements().forEach(node => {
            node.remove();
        });
        let temp = webui.create('div');
        temp.innerHTML = content;
        this.append(...temp.childNodes);
    },
    attrChanged(property, value) {
        const t = this;
        switch (property) {
            case 'rootPage':
                webui._appSettings.rootPage = value;
                break;
            case 'contentExtension':
                webui._appSettings.contentExtension = value;
                break;
            case 'pageContent':
                webui._appSettings.pageContentEndpoint = value;
                break;
            case 'pageData':
                webui._appSettings.pageDataEndpoint = value;
                break;
            case 'pageDataEncrypt':
                webui._appSettings.encryptPageData = value;
                break;
            case 'pageContentEncrypt':
                webui._appSettings.encryptPageContent = value;
                break;
        }
    },
    setBodyClasses() {
        const t = this;
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
        if (t._currentWClass == w) return;
        if (t._currentWClass !== undefined) {
            document.body.classList.remove(t._currentWClass);
        }
        t._currentWClass = w;
        document.body.classList.add(w);
    },
    /** Update the window size classes and variables. Layout sizes follow on their own, from the size observer. */
    applyDynamicStyles() {
        const t = this;
        t.setBodyClasses();
        const rootStyle = document.documentElement.style;
        // Reading the window size does not need a layout.
        const ww = window.innerWidth || document.body.clientWidth;
        const wh = window.innerHeight || document.body.clientHeight;
        if (rootStyle.getPropertyValue('--window-width') !== `${ww}px`) rootStyle.setProperty('--window-width', `${ww}px`);
        if (rootStyle.getPropertyValue('--window-height') !== `${wh}px`) {
            rootStyle.setProperty('--window-height', `${wh}px`);
            // The main height depends on the window height, which the size observer does not see.
            if (t._measured) t.measure();
        }
    },
    /**
     * Set the layout size variables. Sizes are read straight away, while the observer knows layout is current,
     * and written in the next frame. Writing them during the observer's callback would resize main again in the
     * same frame, which browsers report as a ResizeObserver loop error.
     */
    measure() {
        const t = this;
        t._measured = true;
        const height = name => t.getSlot(name)?.clientHeight || 0;
        const width = name => t.getSlot(name)?.clientWidth || 0;
        const wh = window.innerHeight || document.body.clientHeight;
        const values = {
            '--window-width': window.innerWidth || document.body.clientWidth,
            '--window-height': wh,
            '--main-width': t.main.clientWidth,
            '--main-height': wh - (height('header') + height('footer') + height('top') + height('bottom')),
            '--header-height': height('header'),
            '--footer-height': height('footer'),
            '--drawer-left-width': width('left'),
            '--drawer-right-width': width('right'),
            '--drawer-top-height': height('top'),
            '--drawer-bottom-height': height('bottom'),
        };
        t._pendingSizes = values;
        if (t._sizeFrame) return;
        t._sizeFrame = requestAnimationFrame(() => {
            t._sizeFrame = 0;
            const rootStyle = document.documentElement.style;
            for (const [key, px] of Object.entries(t._pendingSizes)) {
                const value = `${px}px`;
                if (rootStyle.getPropertyValue(key) !== value) rootStyle.setProperty(key, value);
            }
        });
    },
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
font-size: max(var(--min-font-size), 0.8rem);
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
transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.25s ease;
transform: scale(1);
opacity: 1;
}
main:focus-visible {
outline: 2px solid var(--color-focus, currentColor);
outline-offset: -2px;
}
main.transition {
transform: scale(0.97);
opacity: 0;
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
