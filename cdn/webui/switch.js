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
            t._optionInfo = new Map();
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
        /**
         * Sets the options, as a pipe separated list such as "one|two|three", or an array (or JSON array) of values or of
         * { value, label, icon } objects. An option with an icon shows only the icon, and its label names the button.
         */
        setOptions(options) {
            const t = this;
            if (typeof options === 'string') {
                const text = options.trim();
                if (text.startsWith('[')) {
                    try { options = JSON.parse(text); } catch { options = []; }
                } else {
                    options = text.split('|');
                }
            }
            t._optionInfo = new Map();
            (Array.isArray(options) ? options : []).forEach(option => {
                const info = option && typeof option === 'object' ? option : { value: option };
                const value = `${info.value ?? ''}`.trim();
                if (!value || t._optionInfo.has(value)) return;
                t._optionInfo.set(value, { value, label: `${info.label || value}`, icon: info.icon ? `${info.icon}` : '' });
            });
            t._options = [...t._optionInfo.keys()];
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
            const keyOf = ({ value, label, icon }) => `${value}\u0001${label}\u0001${icon}`;
            const infos = t._options.map(option => t._optionInfo.get(option));
            const current = [...t._group.children].map(button => button.dataset.key);
            if (current.join('\u0002') !== infos.map(keyOf).join('\u0002')) {
                t._group.replaceChildren(...infos.map(info => {
                    const button = webui.create('button', { type: 'button', role: 'radio' });
                    if (info.icon) {
                        button.classList.add('icon');
                        button.setAttribute('aria-label', info.label);
                        button.title = info.label;
                        button.appendChild(webui.create('webui-icon', { icon: info.icon }));
                    } else {
                        button.innerText = info.label;
                    }
                    button.dataset.value = info.value;
                    button.dataset.key = keyOf(info);
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
button.icon {
padding: 0.2em 0.3em;
line-height: 0;
}
button.icon webui-icon {
display: block;
width: 1.6em;
height: 1.6em;
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
