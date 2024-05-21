/* Dialog component */
"use strict"
{
    const template = document.createElement('template')
    template.setAttribute('shadowrootmode', true);
    template.innerHTML = `
<style type="text/css">
:host {
}
.fade {
display:none;
position:fixed;
top:0;
left:0;
width:100%;
height:100%;
z-index:99999;
transition:all 200ms;
opacity:0;
background-color:rgba(125,125,125,0.4);
align-items: center;
justify-content: center;
}
.fade:not(:empty) {
display:flex;
opacity:1;
}
.dialog {
display:flex;
max-width:80%;
max-height:80%;
flex-direction:column;
}
.fade.closing {

}
</style>
<section></section>
`;
    function ce(n, cls) {
        let el = document.createElement(n);
        el.className = cls;
        return el;
    }
    class Dialog extends HTMLElement {
        constructor() {
            super();
            const shadow = this.attachShadow({ mode: 'open' });
            this.template = template.content.cloneNode(true);
            this.container = this.template.querySelector('section');
            shadow.appendChild(this.template);
            const t = this;
            window.webuiDialog = function (data) {
                let data = data || {};
                let f = ce('section', 'fade');
                this.container.appendChild(f);
                let dlg = ce('section', 'dialog');
                let close = () => {
                    f.classList.add('closing');
                    setTimeout(() => {
                        dlg.remove();
                        setTimeout(() => {
                            f.remove();
                        }, 200);
                    }, 200);
                };
                if (!data.blockClose) {
                    f.addEventListener('click', close);
                }
                f.appendChild(dlg);
            };
        }
        static get observedAttributes() {
            return ["title", "title-on", "title-off", "icon", "icon-on", "icon-off", "icon-family", "icon-family-on", "icon-family-off", "data-enabled", "enabled"];
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            this[property] = newValue;
            this.updateElements();
        }
        connectedCallback() { }
        disconnectedCallback() { }
    }
    customElements.define('webui-dialog', Dialog);
}
