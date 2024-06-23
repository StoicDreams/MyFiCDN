/* Display multi-line, auto-resizing text input field. */
"use strict"
{
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

    webui.define('webui-input-message', {
        constructor: (t) => {
            t.internals = t.attachInternals();
            t.autosize = () => {
                if (t.field.value !== t.value) {
                    t.value = t.field.value;
                    t.internals.setFormValue(t.name, t.value);
                }
                autosizeTextArea(t.field);
            };
            t._handleFormData = t.handleFormData.bind(t);
            talist.push(t);
            t.field = t.template.querySelector('textarea');
            t.field.setAttribute('name', 'message');
            t.field.addEventListener('keydown', handleKeyDown);
            t.field.addEventListener('keyup', t.autosize);
            t.field.addEventListener('change', t.autosize);
        },
        attr: ['title', 'name', 'autofocus', 'value'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'name':
                    t.field.setAttribute('name', value);
                    break;
                case 'autofocus':
                    t.field.setAttribute('autofocus', value);
                    break;
                case 'value':
                    t.field.value = value;
                    break;
            }
        },
        handleFormData: function ({ formData }) {
            if (!this.disabled) {
                formData[this.name] = this.value;
            }
        },
        shadowTemplate: `
<style type="text/css">
:host {
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
font:inherit;
}
</style>
<textarea></textarea>
`
    });
}
