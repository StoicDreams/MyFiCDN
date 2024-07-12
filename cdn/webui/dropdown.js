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
            t._label = t.template.querySelector('label');
            t._select = t.template.querySelector('select');
            t._icon = t.template.querySelector('webui-fa');
            t._select.addEventListener('change', _ => {
                t.value = t._select.value;
                console.log('select changed');
                t.dispatchEvent(new Event('change', { bubbles: true }));
            });
            // Something is copying attributes from the parent webui-dropdown to the select element on the first click in Edge browser.
            function removeBugAttributes() {
                ['style', 'label', 'value', 'preload'].forEach(key => {
                    t._select.removeAttribute(key);
                });
            }
            t.addEventListener('click', ev => {
                removeBugAttributes();
            });
            t._select.addEventListener('focus', ev => {
                setTimeout(() => {
                    removeBugAttributes();
                }, 0);
            });
            t._select.addEventListener('blur', ev => {
                removeBugAttributes();
            });
            t._select.addEventListener('click', ev => {
                removeBugAttributes();
            });
        },
        attr: ['theme', 'icon', 'label', 'stack', 'value'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'theme':
                    t.setTheme(value);
                    break;
                case 'label':
                    t._label.innerHTML = value;
                    break;
                case 'icon':
                    break;
                case 'value':
                    t.setValue(value);
                    break;
            }
        },
        connected: (t) => {
            let id = webui.uuid();
            t.setTheme(t.theme || 'primary');
            t._label.setAttribute('for', id);
            t._select.setAttribute('id', id);
        },
        options: function (options) {
            this.setOptions(options);
        },
        setOptions: function (options) {
            let t = this;
            let data = options.forEach ? options : JSON.parse(options);
            if (!data.forEach) {
                console.error('webui-dropdown data error: Invalid data loaded - Expecting an array of data.');
                return;
            }
            let template = t._optionTemplate;
            t._select.innerHTML = '';
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
                option.innerHTML = template ? webui.replaceAppData(template, item) : id;
                t._select.appendChild(option);
            });
        },
        setValue: function (value) {
            if (value === undefined || value === null) {
                this.setOptions('[]')
                return;
            }
            this.setOptions(value);
        },
        shadowTemplate: `
<style type="text/css">
:host {
display:flex;
gap:var(--padding,1rem);
position:relative;
box-sizing:border-box;
align-items: center;
}
:host([stack]) {
flex-direction:column;
}
select {
display:block;
flex-grow:1;
padding: var(--padding,1rem);
height:100%;
}
label:empty {display:none;}
label {
padding:var(--padding,1rem);
}
slot[name="template"] {display:none;}
</style>
<label>
<webui-fa></webui-fa>
<slot name="label"></slot>
<webui-fa></webui-fa>
</label>
<select><slot></slot></select>
<slot name="template"></slot>
`
    });
}