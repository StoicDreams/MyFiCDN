"use strict"
{
    function extractOptions(options) {
        if (options === undefined || options === null || options === '') {
            return [];
        }
        if (!options) return [];
        if (typeof options === 'string') {
            try {
                let items = JSON.parse(options);
                if (!items || typeof items.forEach !== 'function') {
                    console.error('Invalid dropdown options', items, options);
                    return [];
                }
                return items;
            } catch (ex) {
                let items = options.split(',');
                return items.map(item => {
                    item = item.trim();
                    return { id: item, value: item, display: item };
                });
            }
        }
        if (typeof options.forEach !== 'function') {
            console.error('Invalid dropdown options', options, typeof options);
            return [];
        }
        return options;
    }
    webui.define("webui-dropdown", {
        preload: 'icon',
        apiMethod: 'GET',
        _value: undefined,
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
            t._startIcon = t.template.querySelector('webui-icon.start');
            t._midIcon = t.template.querySelector('webui-icon.mid');
            t._endIcon = t.template.querySelector('webui-icon.end');
            t._datasub = webui.create('webui-data');
            t._select.addEventListener('change', _ => {
                t.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                if (!t._optionsSet) return;
                t.applyDataChange();
            });
        },
        flags: ['multiple'],
        attr: ['icon', 'start-icon', 'mid-icon', 'end-icon', 'label', 'stack', 'value', 'newid', 'newlabel', 'options', 'data-options', 'api'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'api':
                    let segments = value.split('|');
                    let api = value;
                    if (segments.length > 1 && ['get', 'post', 'put', 'delete', 'patch'].indexOf(segments[0].toLowerCase()) !== -1) {
                        t.apiMethod = segments[0].toUpperCase();
                        api = segments[1];
                    }
                    if (api) {
                        t.apiUrl = api;
                    }
                    t.loadData();
                    break;
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
                    if (value) {
                        t._forLabel.classList.remove('hide');
                    } else {
                        t._forLabel.classList.add('hide');
                    }
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
        getApiData: function () {
            const t = this;
            let key = t.dataset.api;
            if (!key || typeof key !== 'string') return [true, {}];
            let data = webui.getData(key);
            if (data === undefined) {
                return [false, {}];
            }
            if (typeof data !== 'object') {
                key = key.split('.').pop();
                let d = {};
                d[key] = data;
                return [true, d];
            }
            return [true, data];
        },
        loadData: function () {
            const t = this;
            if (!t.apiUrl) return;
            let method = t.apiMethod;
            let url = t.apiUrl;
            let ct = t.contentType || 'application/json';
            let fetchData = null;
            const [hasRequiredData, data] = t.getApiData();
            if (!hasRequiredData) {
                t.setOptions([]);
                return;
            };
            if (data) {
                if (method.toLowerCase() === 'get') {
                    let q = [];
                    Object.keys(data).forEach(key => {
                        let value = `${data[key]}`
                        q.push(`${key}=${encodeURIComponent(value)}`);
                    });
                    url = `${url}?${q.join('&')}`;
                } else {
                    if (ct === 'multipart/form-data') {
                        const formData = new FormData();
                        for (const key in data) {
                            if (data.hasOwnProperty(key)) {
                                formData.append(key, data[key]);
                            }
                        }
                        fetchData = formData;
                    } else {
                        fetchData = data;
                        fetchData.headers = {
                            'Content-Type': ct
                        };
                    }
                }
            }
            webui.fetchApi(url, fetchData, method)
                .then(async resp => {
                    let message = await resp.text();
                    if (resp.status < 300) {
                        let json = await JSON.parse(message);
                        t.setOptions(json);
                    } else {
                        if (t.headerMessage) {
                            message = webui.getResponseHeader(resp, ...t.headerMessage.split('|')) || message;
                        }
                        if (message) {
                            webui.log.error(message);
                        }
                    }
                })
                .catch(ex => {
                    webui.log.error('Fetch API Error:', ex);
                });
        },
        connected: (t) => {
            let id = webui.uuid();
            t.appendChild(t._datasub);
            t._forLabel.setAttribute('for', id);
            t._select.setAttribute('id', id);
        },
        applyDataChange: function () {
            const t = this;
            let dn = t.dataset.name;
            if (!dn || !t._optionsSet) { return; }
            if (t.multiple) {
                let s = [];
                t._select.querySelectorAll('option:checked').forEach(option => {
                    let ds = option.dataset.data || '{}';
                    s.push(JSON.parse(ds));
                });
                webui.setData(dn, s);
            } else {
                let s = t._select.querySelector('option:checked');
                if (!s) {
                    webui.setData(dn, '{}');
                } else {
                    webui.setData(dn, JSON.parse(s.dataset.data || '{}'));
                }
            }
        },
        options: function (options) {
            this.setOptions(options);
        },
        setOptions: function (options) {
            const t = this;
            options = extractOptions(options);
            let oJson = JSON.stringify(options);
            if (oJson === t._oJson) return;
            t._oJson = oJson;
            let data = options.forEach ? options : JSON.parse(options);
            if (!data.forEach) {
                console.error('webui-dropdown data error: Invalid data loaded - Expecting an array of data.');
                return;
            }
            let template = t._optionTemplate;
            let value = t.value;
            t._select.innerHTML = '';
            if (t._includeNew) {
                let option = webui.create('option', { value: t.newid, html: t.newlabel });
                option.dataset.data = '{}';
                t._select.appendChild(option);
            }
            data.forEach(item => {
                let id = webui.getDefined(item[t.dataset.id], item.id, item.value);
                if (id === undefined && item.value !== undefined) {
                    id = item.value;
                }
                if (id === undefined) {
                    console.error('webui-dropdown data error: Option is missing value', item);
                    return;
                }
                let display = (t.dataset.display ? item[t.dataset.display] : item.display) || item.display || id;
                let option = webui.create('option', { value: id });
                option.dataset.data = JSON.stringify(item);
                option.innerHTML = template ? webui.replaceAppData(template, item) : display;
                t._select.appendChild(option);
            });
            let dn = t.dataset.name;
            if (dn) {
                let check = webui.getData(dn);
                if (check !== undefined) {
                    value = webui.getDefined(check[t.dataset.id], check.id, check.value);
                }
            }
            t._optionsSet = true;
            t.setValue(value);
        },
        props: {
            'value': {
                get() { return webui.getDefined(this._select.value, ''); },
                set(v) { this.setValue(v); }
            }
        },
        setValue: function (value) {
            const t = this;
            if (!t._isConnected || !t._optionsSet) return;
            value = `${value}`;
            let o = t._select.querySelector(`option[value="${value.replace(/\\/g, '\\\\')}"]`);
            if (!o) {
                if (t.multiple) return;
                o = t._select.querySelector('option');
                if (!o) return;
                value = o.value;
            }
            if (t.value === value && t._value === value) return;
            t._value = value;
            t._select.value = value;
            o.selected = true;
            t.applyDataChange();
            t.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        },
        shadowTemplate: `
<label class="hide">
<webui-icon class="start"></webui-icon>
<slot name="label"></slot>
<webui-icon class="mid"></webui-icon>
</label>
<div>
<select><slot></slot></select>
<webui-icon class="end"></webui-icon>
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
--theme-color:white;
--theme-color-offset:black;
background-color: color-mix(in srgb, var(--theme-color) 90%, black);
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
background-color:var(--theme-color);
color:var(--theme-color-offset);
border-radius:var(--corners);
}
label.hide {display:none;}
label {
display:flex;
align-items:center;
gap:var(--padding);
padding:var(--padding,1rem);
}
webui-icon:not([icon]),
slot[name="template"] {display:none;}
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