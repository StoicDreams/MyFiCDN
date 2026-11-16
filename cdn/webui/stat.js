/*!
 * Web UI Stat - https://webui.stoicdreams.com/components#webui-stat
 * A key number or short result in large type, with a label and an optional description.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    webui.define('webui-stat', {
        attr: ['value', 'label', 'width'],
        constructor() {
            const t = this;
            t._value = t.template.querySelector('.value');
            t._label = t.template.querySelector('.label');
        },
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'value':
                    t._value.textContent = value || '';
                    break;
                case 'label':
                    t._label.textContent = value || '';
                    t._label.hidden = !value;
                    break;
                case 'width':
                    t.style.setProperty('--stat-width', webui.pxIfNumber(value));
                    break;
            }
        },
        connected() {
            const t = this;
            if (!t.hasAttribute('label')) t._label.hidden = true;
        },
        shadowTemplate: `
<div class="value" part="value"></div>
<div class="label" part="label"></div>
<div class="body" part="body"><slot></slot></div>
<style type="text/css">
:host {
--stat-width: 220px;
display: flex;
flex-direction: column;
gap: calc(var(--padding, 1em) * 0.5);
flex: 1 1 var(--stat-width);
min-width: min(100%, var(--stat-width));
padding: calc(var(--padding, 1em) * 2);
border-radius: var(--corners, 4px);
background-color: var(--theme-color, transparent);
color: var(--theme-color-offset, inherit);
box-sizing: border-box;
}
.value {
font-size: clamp(2rem, 1.4rem + 2.4vw, 3rem);
font-weight: 700;
line-height: 1.05;
letter-spacing: -0.02em;
background: var(--fill-accent, currentColor);
-webkit-background-clip: text;
background-clip: text;
color: transparent;
overflow-wrap: anywhere;
}
.label {
font-weight: 600;
font-size: 1.1em;
}
.body {
opacity: 0.85;
}
[hidden] {
display: none;
}
</style>
`
    });
}
