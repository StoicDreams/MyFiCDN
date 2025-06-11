/* Display single-line, text input field. */
"use strict"
webui.define('webui-input-text', {
    constructor: (t) => {
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
    attr: ['id', 'label', 'title', 'name', 'autofocus', 'value', 'type', 'placeholder'],
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
            case 'placeholder':
                t._field.setAttribute('placeholder', value);
                break;
            case 'type':
                t._field.setAttribute('type', value);
                break;
            case 'value':
                t._field.value = value;
                break;
        }
    },
    props: {
        'value': {
            get() { return webui.getDefined(this._field.value, ''); },
            set(v) {
                this._field.value = webui.getDefined(v, '');
                this.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    },
    setValue: function (value) {
        this.value = value;
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
<label></label>
<input></input>
<style type="text/css">
:host {
display:flex;
gap:var(--padding);
width:100%;
max-width:100%;
position:relative;
box-sizing:border-box;
align-items:center;
overflow:auto;
background-color:var(--theme-color);
color:var(--theme-color-offset);
}
:host([vertical]),
:host([compact]) {
grid-template-columns:1fr;
}
:host([compact]) {
display:grid;
gap:0.1em;
}
:host([compact])>label {
font-size:0.8em;
}
:host(:disabled)>input,
:host([readonly])>input {
opacity: 0.5;
outline:none;
}
label {
overflow:hidden;
width:max-content;
max-width:50%;
padding-left: var(--padding);
white-space:nowrap;
text-overflow: ellipsis;
}
input {
height:max-content;
display:block;
position:relative;
flex-grow:1;
line-height:normal;
box-sizing:border-box;
font:inherit;
}
label:empty {
display:none;
}
@container (max-width:400px) {
:host {
display:grid;
gap:0.1em;
}
}
</style>
`
});