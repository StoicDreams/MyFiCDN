/*!
 * Web UI Input Text - https://webui.stoicdreams.com/components#webui-input-text
 * A component for displaying and managing single-line text input fields within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
webui.define('webui-input-text', {
    constructor() {
        const t = this;
        t._field = t.template.querySelector('input');
        t._field.setAttribute('name', 'text');
        t._label = t.template.querySelector('label');
        t.addEventListener('focus', _ => {
            t._field.focus();
        });
        t.addEventListener('click', _ => {
            t._field.focus();
        });
        t._field.addEventListener('input', _ => {
            const value = webui.sanitize(t._field.value);
            if (value !== t._field.value) {
                t._field.value = value;
            }
            if (t._field.type === 'number' && t.hasAttribute('max')) {
                const max = parseFloat(t.getAttribute('max'));
                const current = parseFloat(value);
                if (!isNaN(current) && current > max) {
                    t._field.value = max;
                }
            }
        });
        t._field.addEventListener('change', _ => {
            const value = webui.sanitize(t._field.value);
            if (value !== t._field.value) {
                t._field.value = value;
            }
            if (t._field.type === 'number') {
                const val = parseFloat(value);
                if (!isNaN(val)) {
                    if (t.hasAttribute('max')) {
                        const max = parseFloat(t.getAttribute('max'));
                        if (val > max) t._field.value = max;
                    }
                    if (t.hasAttribute('min')) {
                        const min = parseFloat(t.getAttribute('min'));
                        if (val < min) t._field.value = min;
                    }
                }
            }
            t.setAttribute('value', t._field.value);
        });
    },
    attr: ['id', 'label', 'title', 'name', 'autofocus', 'value', 'type', 'placeholder', 'maxlength', 'minlength', 'min', 'max'],
    attrChanged(property, value) {
        const t = this;
        switch (property) {
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
            case 'type':
                t._field.setAttribute('type', value);
                break;
            case 'value':
                t._field.value = value;
                break;
            case 'minlength':
                t._field.setAttribute('minlength', value);
                break;
            case 'maxlength':
                t._field.setAttribute('maxlength', value);
                break;
            case 'min':
                t._field.setAttribute('min', value);
                break;
            case 'max':
                t._field.setAttribute('max', value);
                break;
        }
    },
    props: {
        'value': {
            get() { return webui.getDefined(this._field.value, ''); },
            set(v) {
                this._field.value = webui.getDefined(v, '');
                this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
            }
        }
    },
    setValue(value) {
        this.value = value;
    },
    connected() {
        const t = this;
        if (!t.getAttribute('type')) {
            t._field.setAttribute('type', 'text');
        }
    },
    formDisabledCallback(isDisabled) {
        this._field.disabled = isDisabled;
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
background-color:var(--theme-color);
color:var(--theme-color-offset);
flex-wrap: wrap;
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
font-size:max(var(--min-font-size), 0.8em);
}
:host(:disabled)>input,
:host([readonly])>input {
opacity: 0.5;
outline:none;
}
label {
overflow:hidden;
width:max-content;
padding-left: var(--padding);
white-space:pre-wrap;
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
max-width:100%;
}
label:empty {
display:none;
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