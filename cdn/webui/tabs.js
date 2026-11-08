/*!
 * Web UI Tabs - https://webui.stoicdreams.com/components#webui-tabs
 * This component is used for creating tabbed sections of content on a page.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    function enableTabFields(content) {
        webui.querySelectorAll('[data-tab-disabled]:not(slot)', content).forEach(item => {
            item.removeAttribute('disabled');
            item.removeAttribute('data-tab-disabled');
        });
    }
    webui.define('webui-tabs', {
        constructor() {
            const t = this;
            t._index = 0;
            t._slotContent = t.template.querySelector('slot[name="content"]');
            t._slotTabs = t.template.querySelector('slot[name="tabs"]');
            t._slotTemplates = t.template.querySelector('slot[name="template"]');
            t._section = t.template.querySelector('section');
        },
        attr: ['pad', 'transition-timing', 'index', 'theme', 'content-theme'],
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'pad':
                    {
                        t.style.setProperty('--theme-padding', webui.pxIfNumber(value));
                    }
                    break;
                case 'transitionTiming':
                    {
                        t._slotContent.style.setProperty('transition-duration', webui.msIfNumber(value));
                    }
                    break;
                case 'index':
                    {
                        // Before the first render this is the starting tab. After it, it switches tabs.
                        const index = parseInt(value) || 0;
                        if (t._initiated) {
                            t.setTab(index);
                        } else {
                            t._index = index;
                        }
                    }
                    break;
            }
        },
        connected() {
            const t = this;
            t.render();
            t.checkResponsiveVertical();
        },
        onResize() {
            this.checkResponsiveVertical();
        },
        setData: function (data, key) {
            const t = this;
            if (!data || !data.forEach) return;
            let templateLabel = '';
            let templateContent = '';
            t._slotTemplates.assignedElements().forEach(template => {
                switch (template.getAttribute('name')) {
                    case 'label':
                        templateLabel = template.innerHTML;
                        break;
                    case 'content':
                        templateContent = template.innerHTML;
                        break;
                }
            });
            webui.removeElements(t, '[data-dynamic]');
            let index = 0;
            data = data.filter(d => Object.keys(d).length > 0);
            data.forEach(item => {
                let displayItem = webui.setDefaultData(item, { name: 'Name', label: 'Missing Label', content: 'Missing Content' });
                displayItem['tab-index'] = index++;
                displayItem['tab-page'] = index;
                let btn = webui.create('webui-button', { slot: 'tabs', 'data-dynamic': '1' });
                let content = webui.create('webui-page-segment', { slot: 'content', 'data-dynamic': '1', 'theme': t.contentTheme || 'inherit' });
                if (templateLabel) {
                    btn.innerHTML = webui.applyAppDataToContent(templateLabel, displayItem);
                } else {
                    btn.innerHTML = displayItem.label;
                }
                if (templateContent) {
                    content.innerHTML = webui.applyAppDataToContent(templateContent, displayItem);
                } else {
                    content.innerHTML = displayItem.content;
                }
                t.appendChild(btn);
                t.appendChild(content);
            });
            t._initiated = false;
            t.render();
        },
        setTab: function (tabIndex) {
            const t = this;
            if (tabIndex === undefined || tabIndex === null) return;
            tabIndex = parseInt(tabIndex) || 0;
            if (!t._initiated) {
                // A tab named in the url is a direct link to it, so it wins over a saved or default tab.
                const linkedTab = t.getTabIndexFromUrl();
                if (linkedTab !== -1) {
                    tabIndex = linkedTab;
                }
            }
            if (t._initiated && tabIndex === t._index) return;
            let index = 0;
            let foundIndex = false;
            Array.from(t.querySelectorAll('[slot="tabs"]')).filter(item => item.parentNode === t).forEach(tab => {
                if (tabIndex === index++) {
                    tab.setAttribute('theme', 'active');
                    // Screen readers hear which tab is showing.
                    tab.setAttribute('aria-current', 'true');
                    t._index = index - 1;
                    foundIndex = true;
                } else {
                    tab.removeAttribute('theme');
                    tab.removeAttribute('aria-current');
                }
            });
            if (tabIndex > 0 && !foundIndex) {
                console.error('did not find tab index', tabIndex);
                t.setTab(tabIndex - 1);
                return;
            }
            index = 0;
            foundIndex = false;
            Array.from(t.querySelectorAll('[slot="content"]')).filter(item => item.parentNode === t).forEach(c => {
                // Other tabs are only moved out of view, so inert keeps keyboard focus and screen readers out of them.
                c.inert = tabIndex !== index;
                if (tabIndex === index++) {
                    let offset = tabIndex * 100;
                    t._slotContent.style.translate = `-${offset}% 0`;
                    foundIndex = true;
                    if (c.previousElementSibling && c.previousElementSibling.hasAttribute && c.previousElementSibling.hasAttribute('hash')) {
                        // Selecting the initial tab is not a navigation, so it adds no history entry or replaces a hash in the url.
                        if (t._initiated) {
                            webui.updateHash(c.previousElementSibling.getAttribute('hash'));
                        } else if (!location.hash) {
                            webui.updateHash(c.previousElementSibling.getAttribute('hash'), true);
                        }
                    }
                    if (t._initiated && t.hasAttribute('vertical') && !t.hasAttribute('narrow')) {
                        t.scrollIntoView({ behavior: 'smooth' });
                    }
                    if (c.nodeName === 'WEBUI-CONTENT') { c.removeAttribute('nofix'); }
                    enableTabFields(c);
                    if (c.nodeName === 'WEBUI-CONTENT' && !c.contentAttached) {
                        webui.wait(_ => {
                            return c.contentAttached;
                        }).then(async _ => {
                            await webui.wait(10);
                            enableTabFields(c);
                        });
                    }
                } else {
                    // Named fields in hidden tabs are disabled, so forms leave them out.
                    // Marked, so fields disabled for other reasons are left disabled.
                    webui.querySelectorAll('[name]:not([disabled]):not(slot)', c).forEach(item => {
                        item.setAttribute('disabled', true);
                        item.setAttribute('data-tab-disabled', '');
                    });
                    if (c.nodeName === 'WEBUI-CONTENT') { c.setAttribute('nofix', true); }
                }
            });
            if (tabIndex > 0 && !foundIndex) {
                console.error('did not find content index', tabIndex);
                setTimeout(() => {
                    t.setTab(tabIndex - 1);
                }, 1);
                return;
            }
            t._index = tabIndex;
            if (t.dataset.subscribe) {
                t.dataset.subscribe.split('|').forEach(ds => {
                    let dss = ds.split(':');
                    if (dss[1] !== 'setTab') return;
                    let curTab = webui.getData(dss[0]);
                    if (curTab !== t._index) {
                        webui.setData(dss[0], t._index);
                    }
                });
            }
            t._initiated = true;
        },
        getTabIndexFromUrl() {
            const t = this;
            const hash = location.hash.substring(1);
            if (!hash) return -1;
            return Array.from(t.children)
                .filter(item => item.getAttribute('slot') === 'tabs')
                .findIndex(item => item.getAttribute('hash') === hash);
        },
        render: function () {
            const t = this;
            let nodes = Array.from(t.querySelectorAll('[slot="content"]')).filter(item => item.parentNode === t);
            t._slotContent.style.setProperty('grid-template-columns', (new Array(nodes.length).fill('100%')).join(' '));
            let tabIndex = 0;
            Array.from(t.querySelectorAll('[slot="tabs"]')).filter(item => item.parentNode === t).forEach(node => {
                const myIndex = tabIndex++;
                if (!node._isSetup) {
                    node._isSetup = true;
                    node.addEventListener('click', _ => {
                        t.setTab(myIndex);
                    });
                }
            });
            if (t.dataset.subscribe) {
                let tabIsSet = false;
                t.dataset.subscribe.split('|').forEach(ds => {
                    let dss = ds.split(':');
                    if (dss.length !== 2 || dss[1] !== 'setTab') return;
                    let cached = webui.getData(dss[0]);
                    if (cached !== undefined) {
                        t.setTab(cached);
                        tabIsSet = true;
                    }
                });
                if (tabIsSet) return;
            }
            t.setTab(t._index || 0);
        },
        checkResponsiveVertical: function () {
            const isNarrow = window.innerWidth < 900;
            const t = this;
            t._forceHorizontal = isNarrow;
            if (isNarrow) {
                if (!t.hasAttribute('narrow')) {
                    t.setAttribute('narrow', true);
                }
            } else if (t.hasAttribute('narrow')) {
                t.removeAttribute('narrow');
            }
        },
        shadowTemplate: `
<slot name="tabs"></slot>
<section>
<slot name="content"></slot>
</section>
<slot name="template"></slot>
<style type="text/css">
:host {
display:block;
overflow:hidden;
width:100%;
width:-webkit-fill-available;
--theme-color:var(--color-title);
--theme-color-offset:var(--color-title-offset);
--theme-padding: 0px;
}
:host([vertical]:not([narrow])) {
display:grid;
grid-template-columns:max-content auto;
}
slot[name="template"] {display:none;}
slot[name="tabs"] {
display:flex;
flex-wrap:wrap;
background-color:var(--theme-color);
color:var(--theme-color-offset);
gap:var(--theme-padding);
border-radius:var(--corners) var(--corners) 0 0;
}
:host([vertical]:not([narrow])) slot[name="tabs"] {
flex-direction:column;
}
slot[name="content"] {
display:grid;
padding:var(--theme-padding);
gap: calc(2 * var(--theme-padding));
width:100%;
box-sizing:border-box;
transition-duration:0;
min-height:100%;
}
::slotted([slot="content"]) {
min-height:100%;
}
section {
display:block;
overflow:hidden;
box-sizing:border-box;
border-radius:0 0 var(--corners) var(--corners);
border:1px solid var(--theme-color);
}
</style>
`
    });
}