"use strict"
{
    webui.define('webui-tabs', {
        constructor: (t) => {
            t._index = 0;
            t._slotContent = t.template.querySelector('slot[name="content"]');
            t._slotTabs = t.template.querySelector('slot[name="tabs"]');
            t._slotTemplates = t.template.querySelector('slot[name="template"]');
            t._section = t.template.querySelector('section');
        },
        attr: ['pad', 'transition-timing', 'index', 'theme', 'content-theme'],
        attrChanged: (t, property, value) => {
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
            }
        },
        connected: (t) => {
            t.render();
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
            console.log('tab index', t, tabIndex);
            if (t._initiated && tabIndex === t._index) return;
            let index = 0;
            let foundIndex = false;
            Array.from(t.querySelectorAll('[slot="tabs"]')).filter(item => item.parentNode === t).forEach(tab => {
                if (tabIndex === index++) {
                    tab.setAttribute('theme', 'active');
                    t._index = index - 1;
                    foundIndex = true;
                } else {
                    tab.removeAttribute('theme');
                }
            });
            if (tabIndex > 0 && !foundIndex) {
                console.error('did not find tab index', tabIndex);
                t.setTab(tabIndex - 1);
                return;
            }
            index = 0;
            foundIndex = false;
            console.log('check tabs', Array.from(t.querySelectorAll('[slot="content"]')));
            Array.from(t.querySelectorAll('[slot="content"]')).filter(item => item.parentNode === t).forEach(c => {
                if (tabIndex === index++) {
                    let offset = tabIndex * 100;
                    t._slotContent.style.translate = `-${offset}% 0`;
                    foundIndex = true;
                    webui.querySelectorAll('[name]:not(slot)', c).forEach(item => { item.removeAttribute('disabled'); });
                } else {
                    console.log('disabled', c.nodeName, c._contentLoaded);
                    webui.querySelectorAll('[name]:not([disabled]):not(slot)', c).forEach(item => { item.setAttribute('disabled', true); });
                    if (c.nodeName === 'WEBUI-CONTENT' && c.hasAttribute('src')) {
                        console.log('TRIGGER DELAYED LOAD');
                        webui.wait(count => {
                            console.log('count', count, c._contentLoaded, c);
                            return c._contentLoaded;
                        }).then(() => {
                            webui.querySelectorAll('[name]:not([disabled]):not(slot)', c).forEach(item => { item.setAttribute('disabled', true); console.log('delayed disabled', c.nodeName, c._contentLoaded); });
                        });
                    }
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
:host([vertical]) {
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
:host([vertical]) slot[name="tabs"] {
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