"use strict"
{
    webui.define('webui-tabs', {
        constructor: (t) => {
            t._slotContent = t.template.querySelector('slot[name="content"]');
            t._slotTabs = t.template.querySelector('slot[name="tabs"]');
            t._section = t.template.querySelector('section');
        },
        attr: ['pad', 'transition-timing', 'index', 'data-suscribe'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'pad':
                    {
                        t.style.setProperty('--theme-padding', webui.pxIfNumber(value));
                    }
                    break;
                case 'transition-timing':
                    {
                        t._slotContent.style.setProperty('transition-duration', webui.pxIfNumber(value));
                    }
                    break;
                case 'data-subscribe':
                    t.setAttribute('data-set', 'setTab');
                    break;
            }
        },
        connected: (t) => {
            t.render();
        },
        setTab: function (tabIndex) {
            if (tabIndex === undefined || tabIndex === null) return;
            let t = this;
            tabIndex = parseInt(tabIndex) || 0;
            if (t._initiated && tabIndex === t.index) return;
            let index = 0;
            let foundIndex = false;
            t.querySelectorAll('[slot="tabs"]').forEach(tab => {
                if (tabIndex === index++) {
                    tab.classList.add('theme-active');
                    t.index = index - 1;
                    foundIndex = true;
                } else {
                    tab.classList.remove('theme-active');
                }
            });
            if (tabIndex > 0 && !foundIndex) {
                console.error('did not find tab index', tabIndex);
                t.setTab(0);
                return;
            }
            index = 0;
            foundIndex = false;
            t.querySelectorAll('[slot="content"]').forEach(_ => {
                if (tabIndex === index++) {
                    let offset = tabIndex * 100;
                    t._slotContent.style.translate = `-${offset}% 0`;
                    foundIndex = true;
                }
            });
            if (tabIndex > 0 && !foundIndex) {
                console.error('did not find content index', tabIndex);
                t.setTab(tabIndex - 1);
                return;
            }
            t.index = tabIndex;
            if (t.dataset.subscribe) {
                webui.setData(t.dataset.subscribe, t.index);
            }
            t._initiated = true;
        },
        render: function () {
            let t = this;
            let nodes = t.querySelectorAll('[slot="content"]');
            t._slotContent.style.setProperty('grid-template-columns', (new Array(nodes.length).fill('100%')).join(' '));
            let tabIndex = 0;
            t.querySelectorAll('[slot="tabs"]').forEach(node => {
                const myIndex = tabIndex++;
                if (!node._isSetup) {
                    node._isSetup = true;
                    node.addEventListener('click', _ => {
                        t.setTab(myIndex);
                    });
                }
            });
            if (t.dataset.subscribe) {
                let cached = webui.getData(t.dataset.subscribe);
                if (cached !== undefined) {
                    t.setTab(cached);
                    return;
                }
            }
            t.setTab(t.index || 0);
        },
        shadowTemplate: `
<style type="text/css">
:host {
display:block;
overflow:hidden;
width:100%;
width:-webkit-fill-available;
--tabs:var(--color-title);
--tabs-offset:var(--color-title-offset);
--theme-padding: 0px;
}
slot[name="tabs"] {
display:flex;
background-color:var(--tabs);
color:var(--tabs-offset);
gap:var(--theme-padding);
border-radius:var(--corners) var(--corners) 0 0;
}
slot[name="content"] {
display:grid;
padding:var(--theme-padding);
gap: calc(2 * var(--theme-padding));
width:100%;
box-sizing:border-box;
transition-duration:0;
}
section {
display:block;
overflow:hidden;
box-sizing:border-box;
border-radius:0 0 var(--corners) var(--corners);
border:1px solid var(--tabs);
}
</style>
<slot name="tabs"></slot>
<section>
<slot name="content"></slot>
</section>
`
    });
}