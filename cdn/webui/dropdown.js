/*!
 * Web UI Dropdown - https://webui.stoicdreams.com/components#webui-dropdown
 * A component for displaying and managing dropdown menus within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    // The select's name for screen readers: its label, or without one the host's aria-label or title.
    function nameField(t, field) {
        const label = (t._label.textContent || '').trim();
        const fallback = label ? '' : (t.getAttribute('aria-label') || t.getAttribute('title') || '').trim();
        if (fallback) field.setAttribute('aria-label', fallback);
        else field.removeAttribute('aria-label');
    }
    // Template values come from data, so they are escaped before the template is read as markup.
    function escapeItem(item) {
        const escaped = {};
        Object.keys(item).forEach(key => {
            const val = item[key];
            escaped[key] = val === undefined || val === null ? '' : typeof val === 'object' ? val : webui.escapeHtml(`${val}`);
        });
        return escaped;
    }
    // Reads markup without running it, to get the text the native option shows.
    const textReader = document.createElement('template');
    function htmlToText(html) {
        textReader.innerHTML = html;
        const text = textReader.content.textContent.replace(/\s+/g, ' ').trim();
        textReader.innerHTML = '';
        return text;
    }
    // Touch screens keep the native picker for plain options, which suits them better than a list.
    const touchPicker = window.matchMedia ? window.matchMedia('(pointer: coarse)') : null;
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
                    let displayId = item.indexOf('|') !== -1 ? item.split('|') : item.split(':');
                    let id = displayId.length === 2 ? displayId[1] : item;
                    let display = displayId.length === 2 ? displayId[0] : item;
                    return { id, value: id, display: display };
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
        constructor() {
            const t = this;
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
            t._select.addEventListener('change', _ => {
                if (!t._optionsSet) return;
                t.applyDataChange();
                t.renderPicked();
            });
            t._field = t._select.parentElement;
            t._picker = t.template.querySelector('button');
            t._picked = t._picker.querySelector('.picked');
            t._list = t.template.querySelector('[role="listbox"]');
            t._picker.addEventListener('click', _ => {
                if (t.isOpen()) t.closeList();
                else t.openList();
            });
            t._picker.addEventListener('keydown', ev => t.onPickerKey(ev));
            // Keep focus on the picker while an option is clicked.
            t._list.addEventListener('pointerdown', ev => ev.preventDefault());
            t._list.addEventListener('click', ev => {
                const item = ev.target.closest('[role="option"]');
                if (item) t.pick(item);
            });
            t._list.addEventListener('pointermove', ev => {
                const item = ev.target.closest('[role="option"]');
                if (item && item !== t._active) t.setActive(item, false);
            });
            t._onOutside = ev => {
                if (!ev.composedPath().includes(t)) t.closeList();
            };
            t._onScroll = _ => {
                if (t._scrollFrame) return;
                t._scrollFrame = requestAnimationFrame(() => {
                    t._scrollFrame = 0;
                    t.placeList();
                });
            };
            t.updateMode();
        },
        flags: ['multiple', 'html-options'],
        attr: ['icon', 'start-icon', 'mid-icon', 'end-icon', 'label', 'stack', 'value', 'newid', 'newlabel', 'options', 'api'],
        attrChanged(property, value) {
            const t = this;
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
                    nameField(t, t._select);
                    nameField(t, t._picker);
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
                case 'multiple':
                    t._select.multiple = !!value;
                    t._list.setAttribute('aria-multiselectable', value ? 'true' : 'false');
                    t.renderPicked();
                    break;
                case 'htmlOptions':
                    t.updateMode();
                    if (t._lastOptions !== undefined) {
                        t._oJson = undefined;
                        t.setOptions(t._lastOptions);
                    }
                    break;
            }
        },
        onResize() {
            if (this.isOpen()) this.placeList();
        },
        async getApiData(lid) {
            const t = this;
            let count = 0;
            let key = t.dataset.api;
            if (!key || typeof key !== 'string') return [true, {}];
            while (++count < 10) {
                let data = webui.getData(key);
                if (data === undefined) {
                    await webui.wait(Math.pow(2, count));
                    if (t._lid !== lid) return [false, {}];
                    continue;
                }
                if (typeof data !== 'object') {
                    key = key.split('.').pop();
                    let d = {};
                    d[key] = data;
                    data = d;
                }
                let fields = t.dataset.fields;
                if (fields && fields.split) {
                    fields = fields.split('|');
                    let matches = 0;
                    fields.forEach(key => {
                        if (data[key] != undefined) {
                            matches++;
                        }
                    });
                    if (matches !== fields.length) {
                        return [false, data];
                    }
                }
                return [true, data];
            }
            return [false, {}];
        },
        async loadData() {
            const t = this;
            if (!t.apiUrl) return;
            const lid = webui.uuid();
            t._lid = lid;
            await webui.wait(100);
            if (t._lid !== lid) return;
            let method = t.apiMethod;
            let url = t.apiUrl;
            let ct = t.contentType || 'application/json';
            let fetchData = null;
            const [hasRequiredData, data] = await t.getApiData(lid);
            // A newer load started while this one waited for data, so its options must not be cleared.
            if (t._lid !== lid) return;
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
                    if (t._lid !== lid) return;
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
        connected() {
            const t = this;
            let id = webui.uuid();
            t._select.setAttribute('id', id);
            t._picker.setAttribute('id', `${id}-picker`);
            t._list.setAttribute('id', `${id}-list`);
            t._picker.setAttribute('aria-controls', `${id}-list`);
            t.linkLabel();
            nameField(t, t._select);
            nameField(t, t._picker);
            if (t._pendingValue !== undefined) {
                t.setValue(t._pendingValue);
            }
        },
        disconnected() {
            this.closeList();
        },
        // Options open in the styled list, so plain and html options look the same. Touch screens keep the native picker for plain options.
        updateMode() {
            const t = this;
            const useList = !!t.htmlOptions || !(touchPicker && touchPicker.matches);
            if (t._useList === useList) return;
            t._useList = useList;
            t._field.classList.toggle('list', useList);
            if (!useList) t.closeList();
            t.linkLabel();
        },
        // The label points at whichever control is shown.
        linkLabel() {
            const t = this;
            const target = t._useList ? t._picker : t._select;
            if (target.id) t._forLabel.setAttribute('for', target.id);
        },
        applyDataChange() {
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
        options(options) {
            this.setOptions(options);
        },
        setOptions(options) {
            const t = this;
            t._lastOptions = options;
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
            const useList = t._useList;
            const useHtml = !!t.htmlOptions;
            const htmlKey = t.dataset.html || 'html';
            let value = t._pendingValue !== undefined ? t._pendingValue : t.value;
            // Built off the page, then inserted once.
            const selectItems = document.createDocumentFragment();
            const listItems = document.createDocumentFragment();
            // Plain options show the option's text, so both kinds of list look the same.
            const addListItem = (id, html, option) => {
                if (!useList) return;
                if (!useHtml) html = webui.escapeHtml(option.textContent);
                const item = document.createElement('div');
                item.setAttribute('role', 'option');
                item.setAttribute('aria-selected', 'false');
                item.id = `option-${listItems.childNodes.length}`;
                item.dataset.value = id;
                item.innerHTML = html;
                listItems.appendChild(item);
            };
            if (t._includeNew) {
                let option = webui.create('option', { value: t.newid, html: t.newlabel });
                option.dataset.data = '{}';
                selectItems.appendChild(option);
                addListItem(`${t.newid}`, t.newlabel, option);
            }
            data.forEach(item => {
                if (typeof item === 'string') {
                    item = { id: item, value: item, display: item };
                }
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
                // Option text often comes from data, such as file names, so data is never read as markup.
                // Only the template's own markup and an item's html field, which the page supplies, are.
                let html = undefined;
                if (typeof item[htmlKey] === 'string') {
                    html = item[htmlKey];
                } else if (template) {
                    html = webui.replaceAppData(template, escapeItem(item));
                }
                if (html === undefined) {
                    option.textContent = display;
                    html = webui.escapeHtml(`${display}`);
                } else {
                    option.textContent = htmlToText(html);
                }
                selectItems.appendChild(option);
                addListItem(`${id}`, html, option);
            });
            t._select.replaceChildren(selectItems);
            t._list.replaceChildren(listItems);
            t._active = undefined;
            let dn = t.dataset.name;
            if (dn) {
                let check = webui.getData(dn);
                if (check !== undefined) {
                    value = webui.getDefined(check[t.dataset.id], check.id, check.value);
                }
            }
            t._optionsSet = true;
            t.setValue(value);
            t.renderPicked();
        },
        isOpen() {
            return this._list.classList.contains('open');
        },
        // Shows the selected options' html in the picker and marks them in the list.
        renderPicked() {
            const t = this;
            if (!t._useList) return;
            const chosen = [];
            t._list.querySelectorAll('[role="option"]').forEach((item, index) => {
                const option = t._select.options[index];
                const isSelected = !!option && option.selected;
                const state = isSelected ? 'true' : 'false';
                if (item.getAttribute('aria-selected') !== state) item.setAttribute('aria-selected', state);
                if (isSelected) chosen.push(item.innerHTML);
            });
            const html = chosen.map(h => `<span class="pick">${h}</span>`).join('');
            if (t._pickedHtml !== html) {
                t._pickedHtml = html;
                t._picked.innerHTML = html;
            }
        },
        openList() {
            const t = this;
            if (!t._useList || t.isOpen()) return;
            const items = t._list.querySelectorAll('[role="option"]');
            if (!items.length) return;
            t._list.classList.add('open');
            if (t._list.showPopover) t._list.showPopover();
            t._picker.setAttribute('aria-expanded', 'true');
            t.placeList();
            const selected = t._list.querySelector('[aria-selected="true"]') || items[0];
            t.setActive(selected, true);
            document.addEventListener('pointerdown', t._onOutside, true);
            document.addEventListener('scroll', t._onScroll, true);
        },
        closeList() {
            const t = this;
            if (!t.isOpen()) return;
            t._list.classList.remove('open');
            if (t._list.hidePopover && t._list.matches(':popover-open')) t._list.hidePopover();
            t._picker.setAttribute('aria-expanded', 'false');
            t._picker.removeAttribute('aria-activedescendant');
            t._active?.classList.remove('active');
            t._active = undefined;
            document.removeEventListener('pointerdown', t._onOutside, true);
            document.removeEventListener('scroll', t._onScroll, true);
        },
        // Places the open list under the picker, or above it when there is more room there.
        placeList() {
            const t = this;
            if (!t.isOpen()) return;
            const rect = t._picker.getBoundingClientRect();
            const style = t._list.style;
            const below = window.innerHeight - rect.bottom;
            const above = rect.top;
            const height = t._list.scrollHeight;
            const showAbove = height > below && above > below;
            const room = Math.max(showAbove ? above : below, 0) - 8;
            style.left = `${Math.max(rect.left, 0)}px`;
            style.minWidth = `${rect.width}px`;
            style.maxHeight = `${Math.min(room, 320)}px`;
            style.top = showAbove ? `${Math.max(rect.top - Math.min(height, room), 0)}px` : `${rect.bottom}px`;
        },
        setActive(item, scroll) {
            const t = this;
            if (!item) return;
            t._active?.classList.remove('active');
            t._active = item;
            item.classList.add('active');
            t._picker.setAttribute('aria-activedescendant', item.id);
            if (scroll) item.scrollIntoView({ block: 'nearest' });
        },
        // Selects a list item, as choosing it in the native select would.
        pick(item) {
            const t = this;
            const index = [...t._list.children].indexOf(item);
            const option = t._select.options[index];
            if (!option) return;
            if (t.multiple) {
                option.selected = !option.selected;
            } else {
                t.closeList();
                if (option.selected) return;
                option.selected = true;
            }
            t._value = t._select.value;
            // The select's own events save the data and reach the host, so listeners hear a pick from the list too.
            t._select.dispatchEvent(new Event('input', { bubbles: true }));
            t._select.dispatchEvent(new Event('change', { bubbles: true }));
        },
        onPickerKey(ev) {
            const t = this;
            const items = [...t._list.querySelectorAll('[role="option"]')];
            if (!items.length) return;
            const open = t.isOpen();
            const index = t._active ? items.indexOf(t._active) : -1;
            const move = to => {
                ev.preventDefault();
                if (!open) t.openList();
                t.setActive(items[Math.min(Math.max(to, 0), items.length - 1)], true);
            };
            switch (ev.key) {
                case 'ArrowDown':
                case 'ArrowUp':
                    ev.preventDefault();
                    if (!open) t.openList();
                    else if (!ev.altKey) move(index + (ev.key === 'ArrowDown' ? 1 : -1));
                    return;
                case 'Home':
                    if (open) move(0);
                    return;
                case 'End':
                    if (open) move(items.length - 1);
                    return;
                case 'Enter':
                case ' ':
                    ev.preventDefault();
                    if (!open) t.openList();
                    else if (t._active) t.pick(t._active);
                    return;
                case 'Escape':
                    if (open) { ev.preventDefault(); t.closeList(); }
                    return;
                case 'Tab':
                    t.closeList();
                    return;
            }
            // Typing a letter jumps to the next option that starts with it.
            if (ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
                const key = ev.key.toLowerCase();
                const count = items.length;
                const from = open ? index : items.findIndex(i => i.getAttribute('aria-selected') === 'true');
                for (let step = 1; step <= count; ++step) {
                    const item = items[(from + step + count) % count];
                    if (item.textContent.trim().toLowerCase().startsWith(key)) {
                        ev.preventDefault();
                        if (open) move(items.indexOf(item));
                        else if (!t.multiple) t.pick(item);
                        return;
                    }
                }
            }
        },
        props: {
            'value': {
                get() { return webui.getDefined(this._select.value, ''); },
                set(v) { this.setValue(v); }
            },
            'display': {
                get() {
                    return [... this._select.selectedOptions].map(i => i.innerText).join(',');
                }
            }
        },
        setValue(value) {
            const t = this;
            if (!t._isConnected || !t._optionsSet) {
                // Attributes and data can arrive before options or connection, so apply this once ready.
                t._pendingValue = value;
                return;
            }
            t._pendingValue = undefined;
            value = `${value}`;
            let o = t._select.querySelector(`option[value="${CSS.escape(value)}"]`);
            let fellBack = false;
            if (!o) {
                if (t.multiple) return;
                o = t._select.querySelector('option');
                if (!o) return;
                value = o.value;
                fellBack = true;
            }
            if (t.value !== value || t._value !== value) {
                t._value = value;
                t._select.value = value;
                o.selected = true;
                t.applyDataChange();
                t.renderPicked();
            }
            // The value it was given, such as none at all, is not an option, so the first option shows instead.
            // Bound data is told, so it matches what is shown. Other listeners only hear picks, not setup.
            if (fellBack && (t.dataset.trigger || t.dataset.bind)) t.triggerChange();
        },
        shadowTemplate: `
<label class="hide">
<webui-icon class="start"></webui-icon>
<slot name="label"></slot>
<webui-icon class="mid"></webui-icon>
</label>
<div>
<select><slot></slot></select>
<button type="button" role="combobox" aria-haspopup="listbox" aria-expanded="false"><span class="picked"></span></button>
<div role="listbox" popover="manual"></div>
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
width:-webkit-fill-available;
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
min-width:0;
}
select {
display:block;
flex-grow:1;
padding: var(--padding, 2px 5px);
height:100%;
background-color:var(--theme-color);
color:var(--theme-color-offset);
border-radius:var(--corners);
max-width:100%;
appearance: none;
-webkit-appearance: none;
}
button {
display:none;
flex-grow:1;
align-items:center;
gap:var(--padding, 0.5em);
min-width:0;
min-height:2em;
padding: var(--padding, 2px 5px);
font:inherit;
text-align:start;
cursor:pointer;
border:none;
background-color:var(--theme-color);
color:var(--theme-color-offset);
border-radius:var(--corners);
}
.list > select {display:none;}
.list > button {display:flex;}
button:focus-visible,
select:focus-visible {
outline:2px solid currentColor;
outline-offset:2px;
}
.picked {
display:flex;
flex-grow:1;
flex-wrap:wrap;
align-items:center;
gap:var(--padding, 0.5em);
min-width:0;
}
.pick {
display:inline-flex;
align-items:center;
gap:0.4em;
}
/* A single choice fills the picker, so its html lays out as it does in the list, such as a count pinned to the right. */
:host(:not([multiple])) .pick {
flex-grow:1;
min-width:0;
}
[role="listbox"] {
display:none;
position:fixed;
inset:auto;
margin:0;
padding:2px 0;
box-sizing:border-box;
overflow:auto;
overscroll-behavior:contain;
border:1px solid color-mix(in srgb, var(--theme-color-offset) 25%, transparent);
border-radius:var(--corners);
box-shadow:0 4px 16px rgb(0 0 0 / 0.25);
background-color:var(--theme-color);
color:var(--theme-color-offset);
z-index:1000;
}
[role="listbox"].open {display:block;}
[role="option"] {
display:flex;
align-items:center;
gap:0.4em;
padding:var(--padding, 4px 8px);
cursor:pointer;
}
[role="option"][aria-selected="true"] {
font-weight:bold;
background-color:color-mix(in srgb, var(--theme-color-offset) 10%, var(--theme-color));
}
[role="option"].active {
outline:2px solid currentColor;
outline-offset:-2px;
background-color:color-mix(in srgb, var(--theme-color-offset) 18%, var(--theme-color));
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
@container container (max-width:600px) {
:host {
display:grid;
gap:0.1em;
}
}
</style>
`
    });
}
