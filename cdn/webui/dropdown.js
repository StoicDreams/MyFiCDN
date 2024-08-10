"use strict"
{
    webui.define("webui-dropdown", {
        preload: 'fa',
        constructor: (t) => {
            t._template = t.template.querySelector('slot[name="template"]');
            let optionTemplate = t.querySelector('[slot="template"]');
            if (optionTemplate) {
                t._optionTemplate = webui.trimLinePreWhitespce(optionTemplate.innerHTML);
            }
            t.newid = '';
            t.newlabel = 'New';
            t._forLabel = t.template.querySelector('label');
            t._label = t.template.querySelector('slot[name="label"]');
            t._select = t.template.querySelector('select');
            t._startIcon = t.template.querySelector('webui-fa.start');
            t._midIcon = t.template.querySelector('webui-fa.mid');
            t._endIcon = t.template.querySelector('webui-fa.end');
            t._datasub = webui.create('webui-data');
            t.appendChild(t._datasub);
            t._select.addEventListener('change', _ => {
                t.value = t._select.value;
                t.dispatchEvent(new Event('change', { bubbles: true }));
                t.applyDataChange();
            });
        },
        attr: ['icon', 'start-icon', 'mid-icon', 'end-icon', 'label', 'stack', 'value', 'newid', 'newlabel', 'options', 'data-options'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'dataOptions':
                    t._datasub.setValue = (val) => {
                        t.setOptions(val);
                    };
                    t._datasub.setAttribute('data-subscribe', value);
                    break;
                case 'options':
                    t.setOptions(value);
                    break;
                case 'newid':
                    t._includeNew = true;
                    break;
                case 'newlabel':
                    t._includeNew = true;
                    break;
                case 'label':
                    t._label.innerHTML = value;
                    break;
                case 'startIcon':
                case 'icon':
                    t._startIcon.setAttribute('icon', value);
                    break;
                case 'midIcon':
                    t._midIcon.setAttribute('icon', value);
                    break;
                case 'endIcon':
                    t._endIcon.setAttribute('icon', value);
                    break;
                case 'value':
                    t.setValue(value);
                    break;
            }
        },
        connected: (t) => {
            let id = webui.uuid();
            t._forLabel.setAttribute('for', id);
            t._select.setAttribute('id', id);
        },
        applyDataChange: function () {
            let t = this;
            let dn = t.dataset.name;
            if (!dn) { return; }
            if (t.hasAttribute('multiple')) {
                let s = [];
                t._select.querySelectorAll('option:checked').forEach(option => {
                    let ds = option.dataset.data || '{}';
                    s.push(JSON.parse(ds));
                });
                webui.setData(dn, s);
            } else {
                let s = t._select.querySelector('option:checked');
                if (!s) {
                    webui.setData(dn, {});
                } else {
                    webui.setData(dn, JSON.parse(s.dataset.data || '{}'));
                }
            }
        },
        options: function (options) {
            this.setOptions(options);
        },
        setOptions: function (options) {
            let t = this;
            if (options === undefined || options === null || options === '') {
                options = [];
            }
            let data = options.forEach ? options : JSON.parse(options);
            if (!data.forEach) {
                console.error('webui-dropdown data error: Invalid data loaded - Expecting an array of data.');
                return;
            }
            let template = t._optionTemplate;
            t._select.innerHTML = '';
            if (t._includeNew) {
                let option = webui.create('option', { value: t.newid, html: t.newlabel });
                option.dataset.data = '{}';
                t._select.appendChild(option);
            }
            data.forEach(item => {
                let id = t.dataset.id ? item[t.dataset.id] : item.id;
                if (id === undefined && item.value !== undefined) {
                    id = item.value;
                }
                if (id === undefined) {
                    console.error('webui-dropdown data error: Option is missing id', item);
                    return;
                }
                let option = webui.create('option', { value: id });
                option.dataset.data = JSON.stringify(item);
                option.innerHTML = template ? webui.replaceAppData(template, item) : item.display || id;
                t._select.appendChild(option);
            });
            if (t.value !== undefined) {
                let o = t._select.querySelector(`option[value="${t.value}"]`);
                if (o) {
                    o.selected = true;
                }
            } else {
                let first = t._select.querySelector('option');
                if (first) {
                    t.value = first.value;
                }
            }
            t.applyDataChange();
        },
        setValue: function (value) {
            let t = this;
            let o = t._select.querySelector(`option[value="${value}"]`);
            if (!o) {
                if (value !== undefined) {
                    t.value = value;
                }
                return;
            }
            t.value = value;
            o.selected = true;
            t.applyDataChange();
        },
        shadowTemplate: `
<label>
<webui-fa class="start"></webui-fa>
<slot name="label"></slot>
<webui-fa class="mid"></webui-fa>
</label>
<div>
<select><slot></slot></select>
<webui-fa class="end"></webui-fa>
</div>
<slot name="template"></slot>
<style type="text/css">
:host {
display:flex;
gap:var(--padding,1rem);
position:relative;
box-sizing:border-box;
align-items: center;
width:100%;
width:-webui-fill-available;
background-color:var(--theme-color);
color:var(--theme-color-offset);
}
:host([stack]) {
display:grid;
}
div {
display:flex;
flex-grow:1;
}
select {
display:block;
flex-grow:1;
padding: var(--padding, 2px 5px);
height:100%;
}
label:empty {display:none;}
label {
display:flex;
align-items:center;
gap:var(--padding);
padding:var(--padding,1rem);
}
webui-fa:not([icon]),
slot[name="template"] {display:none;}
@container (max-width:400px) {
:host {
display:grid;
gap:0.1em;
}
}
</style>
`
    });
}