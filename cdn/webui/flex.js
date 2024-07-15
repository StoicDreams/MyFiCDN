/* Flex container */
"use strict"
webui.define('webui-flex', {
    constructor: (t) => {
        t._style = t.template.querySelector('style');
    },
    attr: ['gap', 'grow', 'column', 'align', 'justify'],
    attrChanged: (t, _property, _value) => {
        t.setStyles();
    },
    getDim: function (value) {
        if (!value) return '';
        return webui.pxIfNumber(value);
    },
    setStyles: function () {
        let t = this;
        let a = t.attributes;
        if (!!a.justify) { t.style.justifyContent = `${a.justify.value}`; }
        if (!!a.align) { t.style.alignItems = `${a.align.value}`; }
        if (a.gap && a.gap.value) { t.style.gap = `${t.getDim(t.attributes.gap.value)}`; }
        else { t.style.gap = 'var(--flexgap,var(--padding,1em))'; }
    },
    shadowTemplate: `
<slot></slot>
<style type="text/css">
:host {
display: flex!important;
container-type:inline-size;
}
:host([grow]) {
flex-grow:1;
}
:host([wrap]) {
flex-wrap:wrap;
}
:host([column]) {
flex-direction:column;
}
</style>
`
});
