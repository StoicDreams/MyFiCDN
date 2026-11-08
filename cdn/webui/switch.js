/*!
 * Web UI Switch - https://webui.stoicdreams.com/components#webui-switch
 * A row of joined buttons for picking one of a few options.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    webui.define('webui-switch', {
        isInput: true,
        attr: ['options', 'value', 'label'],
        constructor() {
            const t = this;
            t._group = t.template.querySelector('[role="radiogroup"]');
            t._options = [];
            t._value = '';
            t._group.addEventListener('click', ev => {
                const button = ev.target.closest('button');
                if (button) t.choose(button.dataset.value);
            });
            t._group.addEventListener('keydown', ev => {
                const index = t._options.indexOf(t._value);
                let next = null;
                switch (ev.key) {
                    case 'ArrowRight':
                    case 'ArrowDown':
                        next = (index + 1) % t._options.length;
                        break;
                    case 'ArrowLeft':
                    case 'ArrowUp':
                        next = (index - 1 + t._options.length) % t._options.length;
                        break;
                    case 'Home':
                        next = 0;
                        break;
                    case 'End':
                        next = t._options.length - 1;
                        break;
                }
                if (next === null || !t._options.length) return;
                ev.preventDefault();
                t.choose(t._options[next]);
                t._group.querySelector('[aria-checked="true"]')?.focus();
            });
        },
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'options':
                    t.setOptions(value);
                    break;
                case 'value':
                    t.setValue(value);
                    break;
                case 'label':
                    if (value) t._group.setAttribute('aria-label', value);
                    else t._group.removeAttribute('aria-label');
                    break;
            }
        },
        props: {
            'value': {
                get() { return this._value; },
                set(v) { this.setValue(v); }
            }
        },
        /** Sets the options, as an array or a pipe separated list such as "one|two|three". */
        setOptions(options) {
            const t = this;
            if (typeof options === 'string') options = options.split('|');
            t._options = (Array.isArray(options) ? options : []).map(option => `${option}`.trim()).filter(option => option);
            t.render();
        },
        /** Selects an option without firing change, as when data sets the value. */
        setValue(value) {
            const t = this;
            t._value = value === undefined || value === null ? '' : `${value}`;
            t.render();
        },
        /** Selects an option the way a click does, firing input and change when it changes. */
        choose(value) {
            const t = this;
            if (value === t._value || !t._options.includes(value)) return;
            t.setValue(value);
            t.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
            t.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        },
        render() {
            const t = this;
            // A value that is not an option yet shows the first option, until the options catch up.
            const selected = t._options.includes(t._value) ? t._value : t._options[0];
            if (selected !== undefined && selected !== t._value) t._value = selected;
            const current = [...t._group.children].map(button => button.dataset.value);
            if (current.join('|') !== t._options.join('|')) {
                t._group.replaceChildren(...t._options.map(option => {
                    const button = webui.create('button', { type: 'button', role: 'radio', text: option });
                    button.dataset.value = option;
                    return button;
                }));
            }
            t._group.querySelectorAll('button').forEach(button => {
                const isSelected = button.dataset.value === selected;
                button.setAttribute('aria-checked', isSelected ? 'true' : 'false');
                // Only the selected option is a tab stop, and arrow keys move between options.
                button.tabIndex = isSelected ? 0 : -1;
            });
        },
        shadowTemplate: `
<div role="radiogroup"></div>
<style type="text/css">
:host {
display: inline-flex;
max-width: 100%;
/* Its own color, since --theme-color is inherited from whatever the switch sits in. */
--switch-color: var(--color-primary);
--switch-color-offset: var(--color-primary-offset);
}
:host([theme]) {
--switch-color: var(--theme-color);
--switch-color-offset: var(--theme-color-offset);
}
[role="radiogroup"] {
display: inline-flex;
flex-wrap: wrap;
border-radius: var(--corners, 6px);
overflow: hidden;
border: 1px solid var(--switch-color);
}
button {
font: inherit;
margin: 0;
border: none;
border-left: 1px solid var(--switch-color);
padding: 0.25em 0.75em;
background-color: transparent;
color: inherit;
cursor: pointer;
white-space: nowrap;
transition: background-color var(--main-transition, 200ms) ease-in-out;
}
button:first-child {
border-left: none;
}
button:hover {
background-color: color-mix(in srgb, var(--switch-color) 25%, transparent);
}
button[aria-checked="true"] {
background-color: var(--switch-color);
color: var(--switch-color-offset);
}
button:focus-visible {
outline: 2px solid var(--color-focus, currentColor);
outline-offset: -4px;
}
</style>
`
    });
}
