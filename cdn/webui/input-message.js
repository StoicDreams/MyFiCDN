/*!
 * Web UI Input Message - https://webui.stoicdreams.com/components#webui-input-message
 * A component for displaying and managing multi-line text input fields.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
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
        if (ev.key === 'Enter' && !ev.ctrlKey) {
            ev.preventDefault();
            ev.stopImmediatePropagation();
            ev.stopPropagation();
            return;
        }
        if (ev.key !== 'Tab' || !ev.shiftKey) { return; }
        if (!ev.target || ev.target.nodeName !== 'TEXTAREA') { return; }
        ev.preventDefault();
        let el = ev.target;
        let text = el.value;
        let postTab = text.slice(el.selectionEnd, text.length);
        let cursorPos = el.selectionEnd;
        let tab = el.getAttribute('tab') || '\t';
        ev.target.value = text.slice(0, el.selectionStart) + tab + postTab;
        cursorPos += tab.length;
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
            t.autosize = () => {
                if (t._lav !== t.value) {
                    t._lav = t.value;
                }
                autosizeTextArea(t._field);
            };
            talist.push(t);
            t._label = t.template.querySelector('label');
            t._field = t.template.querySelector('textarea');
            function onKeyDown(ev) {
                handleKeyDown(ev);
            }
            function onInput(ev) {
                t.autosize();
            }
            t._field.setAttribute('name', 'message');
            t._field.addEventListener('keydown', onKeyDown);
            t._field.addEventListener('keyup', onInput);
            t._field.addEventListener('change', onInput);
            t._field.addEventListener('input', onInput);
        },
        attr: ['title', 'name', 'autofocus', 'value', 'label', 'placeholder', 'tab', 'height', 'max-height'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'height':
                    t.style.height = webui.pxIfNumber(value);
                    break;
                case 'maxHeight':
                    t.style.maxHeight = webui.pxIfNumber(value);
                    break;
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
                case 'tab':
                    t._field.setAttribute('tab', value || '  ');
                    break;
            }
        },
        props: {
            'value': {
                get() { return webui.getDefined(this._field.value, ''); },
                set(v) { this.setValue(webui.getDefined(v, '')); }
            }
        },
        setValue: function (value) {
            const t = this;
            t._field.value = value;
            t._field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
            t._field.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        },
        connected: (t) => {
            let id = webui.uuid();
            t._label.setAttribute('for', id);
            t._field.setAttribute('id', id);
        },
        shadowTemplate: `
<style type="text/css">
:host {
display:block;
position:relative;
min-height:3em;
box-sizing:border-box;
border:var(--theme-border-width) solid var(--theme-color);
overflow:auto;
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
flex-grow:1;
}
webui-flex {
border: 1px solid var(--theme);
background-color: var(--theme);
min-height:100%;
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
