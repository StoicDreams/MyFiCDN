/*!
 * Web UI File Select - https://webui.stoicdreams.com/components#webui-file-select
 * A component for selecting files within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    webui.define("webui-file-select", {
        preload: 'button',
        constructor() {
            const t = this;
            t.label = 'File Select';
            t.labelLimit = 20;
            t._label = t.template.querySelector('label');
            t._input = t.template.querySelector('input');
            t._button = t.template.querySelector('webui-button');
            t._span = t.template.querySelector('label > span');
            t._input.addEventListener('change', _ => {
                let files = t._input.files;
                let list = [];
                if (files.length > 0) {
                    t.classList.add('selected');
                    let remaining = files.length;
                    const fileDone = () => {
                        if (--remaining > 0) return;
                        t.setValue(list.filter(Boolean));
                        t.triggerChange();
                    };
                    for (let index = 0; index < files.length; ++index) {
                        let file = files[index];
                        let reader = new FileReader();
                        reader.onerror = () => {
                            console.error('Failed to read file', file.name, reader.error);
                            fileDone();
                        };
                        reader.onload = function (ev) {
                            let item = {
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                lastModified: file.lastModified,
                                lastModifiedDate: file.lastModifiedDate,
                                content: ev.target.result,
                                // Lets previews play large files without decoding content. Saved as JSON, it becomes {}.
                                file
                            }
                            list[index] = item;
                            fileDone();
                        }
                        let ft = file.type.split('/')[0];
                        switch (ft) {
                            case 'image':
                            case 'text':
                                break;
                            default:
                                ft = file.type;
                                break;
                        }
                        switch (ft) {
                            case 'image':
                            case 'application/pdf':
                                reader.readAsDataURL(file);
                                break;
                            case 'application/json':
                            case 'application/xml':
                            case 'application/xhtml+xml':
                            case 'text':
                                reader.readAsText(file);
                                break;
                            default:
                                reader.readAsDataURL(file);
                                break;
                        }
                    }
                }
            });
            t._button.addEventListener('click', _ => {
                t.classList.remove('selected');
                t._input.value = null;
                t.setValue([]);
                t.triggerChange();
            });
        },
        setValue(value) {
            const t = this;
            if (!value || value.length === undefined || parseInt(value.length) !== value.length) {
                t.value = [];
                t._label.innerHTML = t.label;
            } else {
                t.value = value;
                const names = t.value.map(v => v.name).join(',');
                if (!names) {
                    t._label.innerHTML = t.label;
                    return;
                }
                let label = names;
                if (t.labelLimit && label.length > t.labelLimit) {
                    label = `${label.substr(0, t.labelLimit)}...`;
                }
                // File names come from the visitor's files, so they are shown as text, never markup.
                t._label.textContent = label;
            }
        },
        attr: ['label', 'data-trigger', 'accept', 'multiple', 'label-limit'],
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'label':
                    t._label.innerHTML = value;
                    break;
                case 'labelLimit':
                    t.labelLimit = parseInt(value) || 0;
                    break;
                case 'accept':
                    webui.setOrRemoveAttribute(t._input, 'accept', value);
                    break;
                case 'multiple':
                    if (value === false || value === null) {
                        t._input.removeAttribute('multiple');
                    } else {
                        t._input.setAttribute('multiple', true);
                    }
                    break;
            }
        },
        connected() {
            const t = this;
            let id = webui.uuid();
            t._label.style.backgroundColor = `var(--color-${(t.theme || 'primary')})`;
            t._label.style.color = `var(--color-${(t.theme || 'primary')}-offset)`;
            t._label.setAttribute('for', id);
            t._input.setAttribute('id', id);
            t._label.parentNode.appendChild(t._input);
        },
        shadowTemplate: `
<style type="text/css">
:host {
--theme-shadow-blur:var(--box-shadow-blur, 2px);
display:flex;
position:relative;
box-sizing:border-box;
}
label {
display:flex;
align-items:center;
justify:center;
padding:var(--padding,1rem);
cursor:pointer;
background-color:var(--theme-color);
color:var(--theme-color-offset);
box-shadow:inset 1px 1px var(--theme-shadow-blur) rgba(255,255,255,0.5), inset -1px -1px var(--theme-shadow-blur) rgba(0,0,0,0.5), 1px 1px var(--theme-shadow-blur) rgba(0,0,0,0.5);
white-space:nowrap;
}
:host(.selected) label {
box-shadow:inset -1px -1px var(--box-shadow-blur) rgba(255,255,255,0.5), inset 1px 1px var(--box-shadow-blur) rgba(0,0,0,0.5);
}
input[type="file"] {
z-index:1;
opacity:0.01;
position:absolute;
left:0;
top:0;
width:100%;
height:100%;
cursor:pointer;
}
/* The field is see-through over its label, so the label shows where keyboard focus is. */
label:has(~ input:focus-visible) {
outline:var(--focus-outline);
outline-offset:var(--focus-offset);
}
:host(.selected) input,
:host(:not(.selected)) webui-button {display:none;}
</style>
<label for="file"><slot></slot><span></span></label>
<input type="file" id="file" accept="*" />
<webui-button theme="danger" aria-label="Clear the chosen files" title="Clear the chosen files"><webui-icon icon="xmark"></webui-icon></webui-button>
`
    });
}
