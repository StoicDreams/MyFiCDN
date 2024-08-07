/* Display themed quote */
webui.define("webui-quote", {
    constructor: (t) => {
        t._cite = t.template.querySelector('cite');
    },
    attr: ['cite', 'elevation', 'theme'],
    connected: (t) => {
        if (t.cite) {
            t._cite.innerHTML = t.cite;
        }
    },
    shadowTemplate: `
<slot></slot>
<cite></cite>
<style type="text/css">
:host {
display: block;
margin: var(--padding);
padding: var(--padding);
border-left: calc(2 * var(--padding)) solid var(--theme-color);
box-shadow: var(--elevation-10);
box-sizing: border-box;
}
cite {
margin: 0 0 0 auto;
display: block;
width: max-content;
}
cite:before {
content: "— ";
color: var(--theme-color);
}
cite:empty {display:none;}
</style>`
});
