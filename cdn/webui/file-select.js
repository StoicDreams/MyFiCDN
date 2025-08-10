/*!
 * Web UI File Select - https://webui.stoicdreams.com/components#file-select
 * A component for selecting files within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    webui.define("webui-file-select", {
        preload: 'button fa',
        constructor: (t) => {
            t.contentType = 'bin';
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
                    for (let index = 0; index < files.length; ++index) {
                        let file = files[index];
                        let reader = new FileReader();
                        reader.onload = function (ev) {
                            let item = {
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                lastModified: file.lastModified,
                                lastModifiedDate: file.lastModifiedDate,
                                content: ev.target.result
                            }
                            list.push(item);
                            if (list.length === files.length) {
                                t.setValue(list);
                            }
                        }
                        switch (t.contentType) {
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
            });
        },
        setValue: function (value) {
            const t = this;
            if (!value || value.length === undefined || parseInt(value.length) !== value.length) {
                t.value = [];
                t._label.innerHTML = t.label;
            } else {
                t.value = value;
                let label = t.value.map(v => v.name).join(',') || t.label;
                if (t.labelLimit && label.length > t.labelLimit) {
                    label = `${label.substr(0, t.labelLimit)}...`;
                }
                t._label.innerHTML = label;
            }
            t.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        },
        attr: ['label', 'data-trigger', 'accept', 'multiple', 'content-type', 'label-limit'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'label':
                    t._label.innerHTML = value;
                    break;
                case 'labelLimit':
                    t.labelLimit = parseInt(value) || 0;
                    break;
                case 'accept':
                    t._input.setAttribute('accept', value);
                    ['json', 'txt', 'md', 'html', 'toml', ''].forEach(ft => {
                        if (value.indexOf(`.${ft}`) !== -1) {
                            t.contentType = 'text';
                        }
                    });
                    break;
                case 'multiple':
                    if (value === false) {
                        t._input.removeAttribute('multiple');
                    } else {
                        t._input.setAttribute('multiple', true);
                    }
                    break;
            }
        },
        connected: (t) => {
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
:host(.selected) input,
:host(:not(.selected)) webui-button {display:none;}
</style>
<label><slot></slot><span></span></label>
<input type="file" accept="*" />
<webui-button theme="danger"><webui-icon icon="xmark"></webui-icon></webui-button>
`
    });
}