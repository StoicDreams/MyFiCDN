/* Display input range field. */
"use strict"
webui.define('webui-input-range', {
    isInput: true,
    constructor: (t) => {
        t._field = t.template.querySelector('input');
        t._valueDisplay = t.template.querySelector('span');
        t._label = t.template.querySelector('label');
        t.addEventListener('focus', ev => {
            t._field.focus();
        });
        t.addEventListener('click', _ev => {
            t._field.focus();
        });
        t._field.addEventListener('input', ev => {
            ev.preventDefault();
            ev.stopPropagation();
            t.setValue(t._field.value);
        });
        t._field.addEventListener('change', ev => {
            ev.preventDefault();
            ev.stopPropagation();
            t.setValue(t._field.value);
        });
    },
    attr: ['id', 'label', 'title', 'name', 'autofocus', 'value', 'placeholder', 'min', 'max', 'step', 'onrender'],
    attrChanged: (t, property, value) => {
        switch (property) {
            case 'onrender':
                t.onRender = webui.resolveFunctionFromString(value);
                break;
            case 'id':
                if (value) {
                    t.removeAttribute('id');
                    t._field.setAttribute('id', value);
                }
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
            case 'placeholder':
                t._field.setAttribute('placeholder', value);
                break;
            case 'value':
                if (value === undefined) return;
                if (value = t.value) return;
                t.setValue(value);
                break;
            case 'min':
                t._field.setAttribute('min', value);
                break;
            case 'max':
                t._field.setAttribute('max', value);
                break;
            case 'step':
                t._field.setAttribute('step', value);
                break;
        }
    },
    props: {
        'value': {
            get() { return webui.getDefined(this._field.value, ''); },
            set(v) { this.setValue(v); }
        }
    },
    setValue: function (value) {
        const t = this;
        if (value === undefined) return;
        value = webui.getDefined(value, '');
        if (value === t._eventValue) return;
        t._eventValue = value;
        if (t._field.value !== value) {
            t._field.value = value;
        }
        t.renderValue();
        t.setAttribute('value', t._field.value);
        t.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        t.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    },
    connected: (t) => {
        t.renderValue();
    },
    renderValue() {
        const t = this;
        if (typeof t.onRender === 'function') {
            t._valueDisplay.innerText = t.onRender(t._field.value);
        } else {
            t._valueDisplay.innerText = t._field.value;
        }
    },
    shadowTemplate: `
<label></label>
<span></span>
<input type="range" value="0"></input>
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
padding-bottom:1em;
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
span {
position:absolute;
right:0;
bottom:0.2em;
font-size:0.9em;
}
@container container (max-width:400px) {
:host {
display:grid;
gap:0.1em;
}
}
</style>
`
});