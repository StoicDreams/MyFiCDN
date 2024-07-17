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
        preload: 'flex',
        constructor: (t) => {
            t.internals = t.attachInternals();
            t.autosize = () => {
                if (t._field.value !== t.value) {
                    t.value = t._field.value;
                    t.internals.setFormValue(t.name, t.value);
                }
                autosizeTextArea(t._field);
            };
            t._handleFormData = t.handleFormData.bind(t);
            talist.push(t);
            t._label = t.template.querySelector('label');
            t._field = t.template.querySelector('textarea');
            t._field.setAttribute('name', 'message');
            t._field.addEventListener('keydown', handleKeyDown);
            t._field.addEventListener('keyup', t.autosize);
            t._field.addEventListener('change', t.autosize);
        },
        attr: ['title', 'name', 'autofocus', 'value', 'label', 'placeholder'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'placeholder':
                    t._field.setAttribute('placeholder', value);
                    break;
                case 'label':
                    t._label.innerHTML = value;
                    break;
                case 'name':
                    t._field.setAttribute('name', value);
                    break;
                case 'autofocus':
                    t._field.setAttribute('autofocus', value);
                    break;
                case 'value':
                    t._field.value = value;
                    break;
            }
        },
        connected: (t) => {
            let id = webui.uuid();
            t._label.setAttribute('for', id);
            t._field.setAttribute('id', id);
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
border:var(--theme-border-width) solid var(--theme-color);
}
textarea {
display:block;
position:relative;
width:100%;
min-height:3em;
box-sizing:border-box;
padding:var(--padding);
font:inherit;
resize: none;
outline: none;
border:none;
}
webui-flex {
border: 1px solid var(--theme);
background-color: var(--theme);
}
label {
display:block;
padding:var(--padding);
margin:0;
background-color:var(--theme-color);
color:var(--theme-color-offset);
}
label:empty {
display:none;
}
</style>
<webui-flex column gap="0">
<label></label>
<textarea spellcheck="true" autocomplete="off" autocorrect="off"></textarea>
</webui-flex>
`
    });
}
