"use strict"
{
    webui.define('webui-tabs', {
        constructor: (t) => {
            t._slotContent = t.template.querySelector('slot[name="content"]');
            t._slotTabs = t.template.querySelector('slot[name="tabs"]');
            t._section = t.template.querySelector('section');
        },
        attr: ['pad', 'transition-timing'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'pad':
                    {
                        let num = parseFloat(value);
                        if (`${num}` === value) {
                            t.style.setProperty('--theme-padding', `${num}px`);
                        }
                        else {
                            t.style.setProperty('--theme-padding', value);
                        }
                    }
                    break;
                case 'transition-timing':
                    {
                        let num = parseFloat(value);
                        if (`${num}` === value) {
                            t._slotContent.style.setProperty('transition-duration', `${num}ms`);
                        }
                        else {
                            t._slotContent.style.setProperty('transition-duration', value);
                        }
                    }
                    break;
            }
        },
        connected: (t) => {
            t.render();
        },
        setTab: function (tabIndex) {
            let t = this;
            let index = 0;
            t.querySelectorAll('[slot="tabs"]').forEach(tab => {
                if (tabIndex === index++) {
                    tab.classList.add('theme-active');
                } else {
                    tab.classList.remove('theme-active');
                }
            });
            index = 0;
            t.querySelectorAll('[slot="content"]').forEach(tab => {
                if (tabIndex === index++) {
                    let offset = tabIndex * 100;
                    t._slotContent.style.translate = `-${offset}% 0`;
                }
            });
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
            t.setTab(0);
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