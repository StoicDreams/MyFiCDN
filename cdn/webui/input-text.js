/*!
 * Web UI Input Text - https://webui.stoicdreams.com/components#webui-input-text
 * A component for displaying and managing single-line text input fields within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    // The field's name for screen readers: its label, or without one the host's aria-label, title, or placeholder.
    function nameField(t, field) {
        const label = (t._label.textContent || '').trim();
        const fallback = label ? '' : (t.getAttribute('aria-label') || t.getAttribute('title') || field.getAttribute('placeholder') || '').trim();
        if (fallback) field.setAttribute('aria-label', fallback);
        else field.removeAttribute('aria-label');
    }
webui.define('webui-input-text', {
    constructor() {
        const t = this;
        t._field = t.template.querySelector('input');
        t._field.setAttribute('name', 'text');
        t._label = t.template.querySelector('label');
        // The label names the field, and clicking it focuses the field.
        t._field.id = t._id;
        t._label.htmlFor = t._id;
        t.addEventListener('focus', _ => {
            t._field.focus();
        });
        t.addEventListener('click', _ => {
            t._field.focus();
        });
        // Passwords are never rendered, and altering one would silently change what the user chose.
        const cleanValue = () => t._field.type === 'password' ? t._field.value : webui.sanitizeInput(t._field.value);
        t._field.addEventListener('input', _ => {
            const value = cleanValue();
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
            const value = cleanValue();
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
    attr: ['id', 'label', 'title', 'name', 'autofocus', 'value', 'type', 'placeholder', 'maxlength', 'minlength', 'min', 'max', 'readonly'],
    attrChanged(property, value) {
        const t = this;
        switch (property) {
            case 'id':
                if (value) {
                    t.removeAttribute('id');
                    t._field.setAttribute('id', value);
                    t._label.htmlFor = value;
                }
                break;
            case 'label':
                t._label.innerHTML = value;
                nameField(t, t._field);
                break;
            case 'title':
                nameField(t, t._field);
                break;
            case 'name':
                webui.setOrRemoveAttribute(t._field, 'name', value);
                break;
            case 'autofocus':
                webui.setOrRemoveAttribute(t._field, 'autofocus', value);
                break;
            case 'placeholder':
                webui.setOrRemoveAttribute(t._field, 'placeholder', value);
                nameField(t, t._field);
                break;
            case 'type':
                webui.setOrRemoveAttribute(t._field, 'type', value);
                break;
            case 'value':
                t._field.value = value;
                break;
            case 'minlength':
                webui.setOrRemoveAttribute(t._field, 'minlength', value);
                break;
            case 'maxlength':
                webui.setOrRemoveAttribute(t._field, 'maxlength', value);
                break;
            case 'min':
                webui.setOrRemoveAttribute(t._field, 'min', value);
                break;
            case 'max':
                webui.setOrRemoveAttribute(t._field, 'max', value);
                break;
            case 'readonly':
                // Shown but not changed, as a native field's readonly.
                t._field.readOnly = value !== null && value !== undefined;
                break;
        }
    },
    props: {
        'value': {
            get() { return webui.getDefined(this._field.value, ''); },
            set(v) {
                let value = webui.getDefined(v, '');
                if (this._field.value === value) return;
                this._field.value = value;
            }
        },
        'placeholder': {
            get() { return this._field.getAttribute('placeholder'); },
            set(v) {
                if (this._field.getAttribute('placeholder') === v) return;
                if (v === undefined || v === null) {
                    this._field.removeAttribute('placeholder');
                    return;
                }
                this._field.setAttribute('placeholder', v);
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
        nameField(t, t._field);
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
font-size:var(--font-size-small, 0.8em);
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
font-size:var(--font-size-label, 0.9em);
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
min-width:0;
padding:calc(0.5 * var(--padding, 8px)) var(--padding, 8px);
background-color:var(--color-field, Field);
color:var(--color-field-offset, FieldText);
border:1px solid var(--color-line-strong, currentColor);
border-radius:var(--corners-small, 4px);
transition:border-color var(--transition-fast, 150ms);
}
input::placeholder {
color:var(--color-muted, GrayText);
opacity:1;
}
input:focus {
border-color:var(--color-info, Highlight);
outline:2px solid color-mix(in srgb, var(--color-info, Highlight) 55%, transparent);
outline-offset:1px;
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
}
