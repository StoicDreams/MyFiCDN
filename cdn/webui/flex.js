/* Flex container */
"use strict"
webui.define('webui-flex', {
    constructor: (t) => {
        t._style = t.template.querySelector('style');
        t.setStyles();
    },
    attr: ['gap', 'grow', 'column', 'align', 'justify'],
    attrChanged: (t, _property, _value) => {
        t.setStyles();
    },
    getDim: function (value) {
        if (!value) return '';
        let num = parseFloat(value);
        if (num == value) return `${value}px`;
        return value;
    },
    setStyles: function () {
        let t = this;
        let styles = ["display:flex"];
        let a = t.attributes;
        if (!!a.justify) { styles.push(`justify-content:${a.justify.value};`); }
        if (!!a.align) { styles.push(`align-items:${a.align.value};`); }
        if (!!a.grow) { styles.push('flex-grow:1'); }
        if (!!a.column) { styles.push('flex-direction:column'); }
        if (a.gap && a.gap.value) { styles.push(`gap:${t.getDim(t.attributes.gap.value)}`); }
        else { styles.push('gap:var(--flexgap,var(--padding,1em))'); }
        t._style.innerHTML = `:host{${styles.join(';')};}`;
    },
    shadowTemplate: `
<style type="text/css">
:host {
display: flex!important;
}
</style>
<slot></slot>
`
});
