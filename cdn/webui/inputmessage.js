/* Display multi-line, auto-resizing text input field. */
"use strict"
{
    const template = document.createElement('template')
    template.setAttribute('shadowrootmode', true);
    template.innerHTML = `
<style type="text/css">
::host {
display:block;
position:relative;
min-height:3em;
box-sizing:border-box;
}
textarea {
display:block;
position:relative;
width:100%;
min-height:3em;
box-sizing:border-box;
padding:var(--padding);
}
</style>
<textarea></textarea>
`;
    function autosizeTextArea(target) {
        if (target.nodeName !== 'TEXTAREA') { return; }
        setTimeout(() => {
            target.style.height = `0px`;
            let newHeight = target.scrollHeight;
            target.style.height = `${(newHeight + 30)}px`;
        }, 1);
    }
    function handleKeyDown(ev) {
        if (ev.key !== 'Tab' || !ev.shiftKey) { return; }
        if (!ev.target || ev.target.nodeName !== 'TEXTAREA') { return; }
        ev.preventDefault();
        let el = ev.target;
        let text = el.value;
        let postTab = text.slice(el.selectionEnd, text.length);
        let cursorPos = el.selectionEnd;
        ev.target.value = text.slice(0, el.selectionStart) + "\t" + postTab;
        ++cursorPos;
        el.selectionStart = cursorPos;
        el.selectionEnd = cursorPos;
    }
    function UpdateAllDisplayedTextareaSizes() {
        let index = 0;
        while (index < talist.length) {
            if (!talist[index].offsetParent) {
                talist.shift();
                continue;
            }
            talist[index++].autosize();
        }
    }
    const talist = [];
    window.addEventListener('resize', UpdateAllDisplayedTextareaSizes);
    class InputMessage extends HTMLElement {
        static formAssociated = true;
        internals;
        shadowRoot;
        constructor() {
            super();
            this.internals = this.attachInternals();
            const shadow = this.attachShadow({ mode: 'open' });
            const t = this;
            t.autosize = () => {
                if (t.field.value !== t.value) {
                    t.value = t.field.value;
                    t.internals.setFormValue(t.name, t.value);
                }
                autosizeTextArea(t.field);
            };
            this._handleFormData = this.handleFormData.bind(this);
            talist.push(t);
            t.template = template.content.cloneNode(true);
            t.field = t.template.querySelector('textarea');
            t.field.setAttribute('name', 'message');
            t.field.addEventListener('keydown', handleKeyDown);
            t.field.addEventListener('keyup', t.autosize);
            t.field.addEventListener('change', t.autosize);
            shadow.appendChild(t.template);
        }
        static get observedAttributes() {
            return ['title', 'name', 'autofocus', 'value'];
        }
        handleFormData({ formData }) {
            if (!this.disabled) {
                formData[this.name] = this.value;
            }
        }
        attributeChangedCallback(property, oldValue, newValue) {
            if (oldValue === newValue) return;
            this[property] = newValue;
            switch (property) {
                case 'name':
                    this.field.setAttribute('name', newValue);
                    break;
                case 'autofocus':
                    this.field.setAttribute('autofocus', newValue);
                    break;
                case 'value':
                    this.field.value = newValue;
                    break;
            }
        }
        connectedCallback() { }
        disconnectedCallback() { }
    }
    customElements.define('webui-inputmessage', InputMessage);
}
