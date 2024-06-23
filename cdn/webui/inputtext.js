/* Display multi-line, auto-resizing text input field. */
"use strict"
webui.define('webui-inputtext', {
    constructor: (t) => {
        t.internals = t.attachInternals();
        t._handleFormData = t.handleFormData.bind(t);
        t._field = t.template.querySelector('input');
        t._field.setAttribute('name', 'text');
        t._label = t.template.querySelector('label');
        t.addEventListener('focus', ev => {
            t._field.focus();
        });
        t.addEventListener('click', _ev => {
            t._field.focus();
        });
        t._field.addEventListener('input', _ev => {
            t.setAttribute('value', t._field.value);
        });
        t._field.addEventListener('change', _ev => {
            t.setAttribute('value', t._field.value);
        });
    },
    attr: ['id', 'label', 'title', 'name', 'autofocus', 'value', 'type'],
    attrChanged: (t, property, value) => {
        switch (property) {
            case 'id':
                if (value) {
                    t.removeAttribute('id');
                    t._field.setAttribute('id', value);
                }
            case 'label':
                t._label.innerHTML = value;
                break;
            case 'name':
                t._field.setAttribute('name', value);
                break;
            case 'autofocus':
                t._field.setAttribute('autofocus', value);
                break;
            case 'type':
                t._field.setAttribute('type', value);
                break;
            case 'value':
                t._field.value = value;
                break;
        }
    },
    connected: (t) => {
        if (!t.getAttribute('type')) {
            t._field.setAttribute('type', 'text');
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
display:grid;
grid-template-columns:min-content auto;
gap:var(--padding);
width:100%;
position:relative;
box-sizing:border-box;
}
:host(:disabled)>input,
:host([readonly])>input {
opacity: 0.5;
outline:none;
}
label {
width:max-content;
}
input {
display:block;
position:relative;
width:100%;
line-height:normal;
box-sizing:border-box;
font:inherit;
}
</style>
<label></label>
<input></input>
`
});