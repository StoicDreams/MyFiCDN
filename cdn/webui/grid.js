"use strict"
{
    webui.define('webui-grid', {
        constructor: (t) => { },
        attr: ['columns', 'min', 'max', 'gap', 'width', 'height'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'gap':
                    t.style.gap = webui.pxIfNumber(value);
                    break;
                case 'columns':
                    let num = parseInt(value);
                    if (num === t.columns || `${num}` === t.columns) {
                        t.style.setProperty('--columns', `repeat(${num}, minmax(var(--min), var(--max))`);
                    } else {
                        t.style.setProperty('--columns', t.columns);
                    }
                    break;
                case 'min':
                    t.style.setProperty('--min', webui.pxIfNumber(value));
                    break;
                case 'max':
                    t.style.setProperty('--max', webui.pxIfNumber(value));
                    break;
                case 'width':
                    t.style.setProperty('--min', webui.pxIfNumber(value));
                    break;
                case 'height':
                    t.style.setProperty('--height', webui.pxIfNumber(value));
                    break;
            }
        },
        connected: (t) => {
        },
        shadowTemplate: `
<slot></slot>
<style type="text/css">
:host {
--min:10ch;
--max:1fr;
--height:auto;
--columns:repeat(auto-fit, minmax(var(--min), var(--max)));
display:grid;
background-color:color-mix(in srgb, var(--theme-color) 90%, white);
color:var(--theme-color-offset);
grid-auto-rows: min-content auto;
grid-template-columns: var(--columns);
gap:var(--padding);
::slotted(*) {
min-width:var(--min);
max-width:var(--max);
min-height:var(--height);
}
}
</style>
`
    })
}