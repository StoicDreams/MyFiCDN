/*!
 * Web UI Edit In Place - https://webui.stoicdreams.com/components#webui-edit-in-place
 * Text that is edited where it is shown: clicking it puts a field with Cancel and Save in its place.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    webui.define('webui-edit-in-place', {
        preload: 'input-text button icon',
        attr: ['value', 'label', 'edit-title', 'placeholder', 'required'],
        constructor() {
            const t = this;
            t._editing = false;
            t._saving = false;
            t._text = t.template.querySelector('.edit-text');
            t._shown = t.template.querySelector('.edit-value');
            t._form = t.template.querySelector('.edit-form');
            t._input = t.template.querySelector('webui-input-text');
            t._cancel = t.template.querySelector('.edit-cancel');
            t._save = t.template.querySelector('.edit-save');
            // The field's own change events stay inside, so change only means the text was saved.
            t._form.addEventListener('change', ev => ev.stopPropagation());
            t._text.addEventListener('click', () => t.edit());
            t._cancel.addEventListener('click', () => t.cancel());
            t._save.addEventListener('click', () => t.save());
            t._input.addEventListener('keydown', ev => {
                if (ev.key === 'Enter') {
                    ev.preventDefault();
                    t.save();
                } else if (ev.key === 'Escape') {
                    // Escape closes the field only, not a dialog or drawer it sits in.
                    ev.preventDefault();
                    ev.stopPropagation();
                    t.cancel();
                }
            });
        },
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'value':
                    // Text, never markup: what is edited often comes from users.
                    t._shown.textContent = `${value ?? ''}`;
                    break;
                case 'label':
                    t._input.setAttribute('aria-label', value || 'Text');
                    if (!t.getAttribute('edit-title')) t._text.title = value ? `Edit ${value}` : 'Edit';
                    break;
                case 'editTitle':
                    t._text.title = value || (t.getAttribute('label') ? `Edit ${t.getAttribute('label')}` : 'Edit');
                    break;
                case 'placeholder':
                    if (value) t._input.setAttribute('placeholder', value);
                    else t._input.removeAttribute('placeholder');
                    break;
            }
        },
        connected() {
            const t = this;
            t._shown.textContent = `${t.getAttribute('value') ?? ''}`;
            if (!t._text.title) t._text.title = 'Edit';
            if (!t._input.hasAttribute('aria-label')) t._input.setAttribute('aria-label', t.getAttribute('label') || 'Text');
        },
        disconnected() {
            const t = this;
            if (t._editing) t.close(false);
        },
        props: {
            /** Whether the field is open. */
            'editing': {
                get() { return this._editing; },
            },
        },
        /** Opens the field with the current text, chosen, so typing replaces it. */
        async edit() {
            const t = this;
            if (t._editing) return;
            t._editing = true;
            t.setAttribute('editing', '');
            t._text.hidden = true;
            t._form.hidden = false;
            await customElements.whenDefined('webui-input-text');
            if (!t._editing) return;
            t._input.value = `${t.getAttribute('value') ?? ''}`;
            t._input._field?.focus();
            t._input._field?.select();
        },
        /** Closes the field and leaves the text as it was. */
        cancel() {
            const t = this;
            if (!t._editing) return;
            t.close(true);
            t.dispatchEvent(new CustomEvent('cancel', { bubbles: true }));
        },
        close(refocus) {
            const t = this;
            t._editing = false;
            t._saving = false;
            t.removeAttribute('editing');
            t.removeAttribute('saving');
            t._form.hidden = true;
            t._text.hidden = false;
            if (refocus) t._text.focus();
        },
        /**
         * Saves what was typed, trimmed. The same text closes the field. Otherwise a `save` event asks the page, which
         * can refuse it with preventDefault, or pass a promise to `detail.waitUntil` that resolves to false to refuse
         * it, such as when a server says no. A refusal leaves the field open to correct. Once saved, `value` is the
         * new text and a `change` event says so.
         */
        async save() {
            const t = this;
            if (!t._editing || t._saving || !customElements.get('webui-input-text')) return;
            const previous = `${t.getAttribute('value') ?? ''}`;
            const value = `${t._input.value ?? ''}`.trim();
            if (!value && t.hasAttribute('required')) {
                webui.alert(t.getAttribute('required') || 'This cannot be empty.', 'warning');
                return;
            }
            if (value === previous) {
                t.close(true);
                return;
            }
            const waits = [];
            const ev = new CustomEvent('save', {
                bubbles: true, cancelable: true,
                detail: { value, previous, waitUntil: promise => waits.push(promise) },
            });
            t._saving = true;
            t.setAttribute('saving', '');
            const allowed = t.dispatchEvent(ev);
            let ok = allowed;
            if (allowed && waits.length) {
                try {
                    ok = (await Promise.all(waits)).every(result => result !== false);
                } catch (_) {
                    ok = false;
                }
            }
            if (!t._editing) return;
            t._saving = false;
            t.removeAttribute('saving');
            if (!ok) {
                t._input._field?.focus();
                return;
            }
            t.setAttribute('value', value);
            t.close(true);
            t.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { value, previous } }));
        },
        shadowTemplate: `
<button type="button" class="edit-text" part="text"><span class="edit-value" part="value"></span><webui-icon icon="pencil" part="icon" aria-hidden="true"></webui-icon></button>
<span class="edit-form" part="editor" hidden>
<webui-input-text class="edit-field" part="field"></webui-input-text>
<webui-button class="edit-cancel" part="cancel" theme="secondary" start-icon="xmark" label="Cancel"></webui-button>
<webui-button class="edit-save" part="save" theme="primary" start-icon="save" label="Save"></webui-button>
</span>
<style type="text/css">
:host {
display: inline-flex;
align-items: center;
max-width: 100%;
min-width: 0;
}
:host([hidden]) {
display: none;
}
[hidden] {
display: none !important;
}
.edit-text {
display: inline-flex;
align-items: center;
gap: 0.4em;
max-width: 100%;
min-width: 0;
padding: 0.1em 0.35em;
font: inherit;
color: inherit;
background: none;
border: 1px solid transparent;
border-radius: var(--corners, 4px);
cursor: pointer;
text-align: start;
}
.edit-text:hover,
.edit-text:focus-visible {
border-color: color-mix(in srgb, currentColor 30%, transparent);
}
.edit-value {
min-width: 0;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
}
.edit-text webui-icon {
flex: 0 0 auto;
font-size: 0.8em;
opacity: 0.6;
}
.edit-form {
display: inline-flex;
flex-wrap: wrap;
align-items: center;
gap: calc(var(--padding, 8px) / 2);
min-width: 0;
flex: 1 1 auto;
}
.edit-field {
flex: 1 1 12em;
min-width: 8em;
}
:host([saving]) .edit-form {
opacity: 0.7;
pointer-events: none;
}
</style>
`,
    });
}
