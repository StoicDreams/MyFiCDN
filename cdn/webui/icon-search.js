/*!
 * Web UI Icon Search - https://webui.stoicdreams.com/components#webui-icon-search
 * A component for searching and filtering icons within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    const srcRoot = webui.getData('appName') === 'My Fidelity CDN' ? '/icons/' : 'https://cdn.myfi.ws/icons/';
    const emojiSource = webui.getData('appName') === 'My Fidelity CDN' ? '/i/emojis.json' : 'https://cdn.myfi.ws/i/emojis.json';
    webui.define('webui-icon-search', {
        pipedValue: '',
        preload: "icon dropdown input-range input-text input-message",
        _emojiEnabled: false,
        _filteredKeys: [],
        _viewEl: [],
        _icons: [],
        _emojis: [],
        _containers: [],
        connected() {
            this.setupComponent();
        },
        applyPagination() {
            const t = this;
            let id = webui.uuid();
            t._apid = id;
            setTimeout(async () => {
                if (t._apid !== id) return;
                if (!t._pag) return;
                t.applyFilter();
            }, 10);
        },
        props: {
            'currentFilter': {
                get() {
                    const t = this;
                    return `${t.page};${t.perPage};${t.totalCount};${t.pageCount};${t._filteredKeys.length};${t._emojiEnabled};${t._inputSearch.value}`;
                }
            },
            'page': {
                get() { return this._pag.page; },
                set(v) {
                    const t = this;
                    t._pag.page = v;
                }
            },
            'perPage': {
                get() { return this._pag.perPage; },
                set(v) {
                    const t = this;
                    t._pag.perPage = v;
                }
            },
            'pageCount': {
                get() { return this._pag.pageCount; }
            },
            'totalCount': {
                get() { return this._pag.totalCount; },
                set(v) {
                    const t = this;
                    t._pag.totalCount = v;
                }
            }
        },
        setupComponent() {
            const t = this;
            t.style.display = 'flex';
            t.style.flexDirection = 'column';
            t.style.flexGap = 'var(--padding)';
            let colorOptions = JSON.stringify([
                { value: '', display: 'None' },
                { value: 'black', display: 'Black' },
                { value: 'white', display: 'White' },
                { value: 'title', display: 'Title' },
                { value: 'primary', display: 'Primary' },
                { value: 'secondary', display: 'Secondary' },
                { value: 'tertiary', display: 'Tertiary' },
                { value: 'info', display: 'info' },
                { value: 'success', display: 'success' },
                { value: 'warning', display: 'warning' },
                { value: 'danger', display: 'danger' },
                { value: 'active', display: 'Active' },
                { value: 'button', display: 'Button' },
                { value: 'action', display: 'Action' }
            ]);
            let shapeOptions = JSON.stringify([
                { value: '', display: 'Square' },
                { value: 'badge', display: 'Badge' },
                { value: 'circle', display: 'Circle' },
                { value: 'cloud', display: 'Cloud' },
                { value: 'triangle', display: 'Triangle' },
                { value: 'octo', display: 'Octogon' },
            ]);
            t._modPath = 1;
            t._inputs = webui.create('webui-grid', { columns: '1fr 1fr', theme: 'background' });
            t.appendChild(t._inputs);
            t._svgContainer = webui.create('div', { style: 'display:block;position:relative;aspect-ratio:1;padding:0;margin:auto;width:50%;max-width:300px;' });
            t._inputs.appendChild(t._svgContainer);
            t._iconPreview = webui.create('webui-icon', { style: 'position:absolute;width:100%;top:0;left:0;' });
            t._svgContainer.appendChild(t._iconPreview);
            let icons = [];
            icons.push(t._iconPreview);
            let inputsColumn = webui.create('webui.flex', { column: '' });
            t._inputs.appendChild(inputsColumn);
            inputsColumn.appendChild(webui.create('h6', { html: `<strong>Icon Search</strong>` }));
            t._inputSearch = webui.create('webui-input-text', { 'label': `Search / Filter Icons`, value: '', placeholder: "menu" });
            t._pag = webui.create('webui-pagination', { loop: true });
            t._pag.addEventListener('change', _ => { t.applyPagination(); });
            t._iconFlags = webui.create('webui-flex', { name: 'icon-options', justify: 'flex-start', align: 'center', wrap: true, gap: 5, html: `<h6 class="f1">Flags:</h6>` });
            inputsColumn.appendChild(t._iconFlags);
            function setupDropdown(key, label, attr, options) {
                let dd = webui.create('webui-dropdown', { label: label, options: options });
                inputsColumn.appendChild(dd);
                dd.addEventListener('change', _ => {
                    let value = dd.value;
                    icons.forEach(icon => {
                        if (!value) {
                            icon.removeAttribute(attr);
                        } else {
                            icon.setAttribute(attr, value);
                        }
                    });
                    t.buildIconCode();
                });
                t[key] = dd;
            }
            function setupToggleIcon(name, label, flagAttr, emojiFlag = false) {
                t[name] = webui.create('webui-toggle-icon', { label: label, 'title-on': `Disable ${label}`, 'title-off': `Enable ${label}`, 'theme-on': 'success', 'theme-off': 'shade', 'flags-on': 'fill', 'flags-off': '' });
                t[name].addEventListener('change', _ => {
                    if (emojiFlag) {
                        t._emojiEnabled = t[name].value;
                        t.applyFilter();
                    } else {
                        icons.forEach(icon => {
                            if (t[name].value) {
                                icon.setAttribute(flagAttr, '');
                            } else {
                                icon.removeAttribute(flagAttr);
                            }
                        });
                    }
                    t.buildIconCode();
                });
                t._iconFlags.appendChild(t[name]);
            }
            setupDropdown('_theme', 'Icon Theme', 'theme', colorOptions);
            setupDropdown('_shape', 'Shape', 'shape', shapeOptions);
            setupDropdown('_stroke', 'Stroke', 'stroke', JSON.stringify([
                { value: '', display: 'Regular' },
                { value: 'thin', display: 'Thin' },
                { value: 'thick', display: 'Thick' }
            ]));
            setupDropdown('_shade', 'Shade', 'shade', JSON.stringify([
                { value: '', display: 'Regular' },
                { value: 'duo', display: 'Duo' },
                { value: 'tri', display: 'Trio' }
            ]));
            t._rotate = webui.create('webui-input-range', { label: 'Rotation', min: 0, max: 355, step: 5 });
            inputsColumn.appendChild(t._rotate);
            {
                function inputUpdated() {
                    let value = t._rotate.value;
                    icons.forEach(icon => {
                        if (value > 0) {
                            icon.setAttribute('rotate', value);
                        } else {
                            icon.removeAttribute('rotate');
                        }
                        t.buildIconCode();
                    });
                }
                t._rotate.addEventListener('input', inputUpdated);
            }
            setupToggleIcon('_emojisToggle', 'Emojis', null, true);
            setupToggleIcon('_backingToggle', 'Backing', 'backing');
            setupToggleIcon('_sharpToggle', 'Sharp', 'sharp');
            setupToggleIcon('_fillToggle', 'Fill', 'fill');
            setupToggleIcon('_borderedToggle', 'Bordered', 'bordered');
            setupToggleIcon('_banToggle', 'Ban', 'ban');
            setupToggleIcon('_invertedToggle', 'Inverted', 'inverted');
            t.appendChild(t._inputSearch);
            t.appendChild(t._pag);
            t._codeSample = webui.create('webui-code', { 'lang': 'html', 'label': `Icon Code` });
            inputsColumn.appendChild(t._codeSample);
            inputsColumn.appendChild(webui.create('p', { html: `Icon components also accept pipe delimited configurations, useful when passing icon data to parent components that pass icon values to child webui-icon components.` }));
            t._codeSamplePiped = webui.create('webui-code', { 'lang': 'html', 'label': `Icon Code Piped` });
            inputsColumn.appendChild(t._codeSamplePiped);
            t._codePipedAttr = webui.create('webui-code', { 'lang': 'html', 'label': `Icon Code Piped` });
            inputsColumn.appendChild(t._codePipedAttr);
            t._bottomGrid = webui.create('webui-grid', { gap: '1', theme: 'white', width: '100', height: '100' });
            t.appendChild(t._bottomGrid);
            t.loadAllData();
            t._inputSearch.addEventListener('input', _ => {
                t.page = 1;
                t.applyFilter();
            });
        },
        applyFilter() {
            const t = this;
            const cf = t.currentFilter;
            if (cf === t._cf) return;
            t._cf = cf;
            if (typeof t._inputSearch.value !== 'string') return;
            let filter = t._inputSearch.value.trim().toLowerCase();
            t._filteredKeys = [];
            let source = t._emojiEnabled ? t._emojis : t._icons;
            source.forEach(icon => {
                if (!filter) {
                    t._filteredKeys.push(icon);
                    return;
                }
                if (icon.name.toLowerCase().indexOf(filter) !== -1) {
                    t._filteredKeys.push(icon);
                    return;
                }
                if (icon.tags.indexOf(filter) !== -1) {
                    t._filteredKeys.push(icon);
                }
            });
            t.totalCount = t._filteredKeys.length;
            t.render();
        },
        buildIconCode() {
            const t = this;
            let ico = t._iconPreview.cloneNode();
            ico.removeAttribute('style');
            ico.removeAttribute('has-shadow');
            let code = ico.outerHTML;
            t._codeSample.value = code;
            let pipeData = [];
            pipeData.push(ico.getAttribute('icon'));
            ico.getAttributeNames().forEach(attr => {
                switch (attr) {
                    case 'has-shadow':
                    case 'icon':
                        break;
                    default:
                        let value = ico.getAttribute(attr);
                        if (value) {
                            pipeData.push(`${attr}:${value}`);
                        } else {
                            pipeData.push(`${attr}`);
                        }
                        break;
                }
            })
            t.pipedValue = pipeData.join('|');
            t._pipedPostfix = pipeData.splice(1).join('|');
            t._codeSamplePiped.value = `<webui-icon icon="${t.pipedValue}"></webui-icon>`;
            t._codePipedAttr.value = t.pipedValue;
            t.applyPipedValues();
            let ev = new CustomEvent('icon-update', { detail: t.pipedValue });
            t.dispatchEvent(ev);
        },
        appendPipe(name) {
            const t = this;
            if (!t._pipedPostfix) return name;
            return `${name}|${t._pipedPostfix}`;
        },
        applyPipedValues() {
            const t = this;
            t._containers.forEach(con => {
                con.el.setAttribute('icon', t.appendPipe(con.icon.name));
            });
        },
        resetOptions() {
            const t = this;
            ['_backingToggle', '_sharpToggle', '_fillToggle', '_borderedToggle', '_banToggle', '_invertedToggle'].forEach(toggle => {
                if (!t[toggle]) return;
                t[toggle].value = false;
            });
            ['_theme', '_shape', '_stroke', '_shade'].forEach(dd => {
                if (!t[dd]) return;
                t[dd].value = '';
            });
            t._rotate.value = 0;
        },
        setIconFromCode(pipedValue) {
            const t = this;
            t.resetOptions();
            let pipedData = pipedValue.split('|');
            let icon = pipedData.shift();
            t.setIcon(icon);
            pipedData.forEach(segment => {
                if (segment.indexOf(':') !== -1) {
                    let kv = segment.split(':');
                    let dd = t[`_${kv[0]}`];
                    if (dd) {
                        dd.value = kv[1];
                    }
                } else {
                    let toggle = t[`_${segment}Toggle`];
                    if (toggle) {
                        toggle.value = true;
                    }
                }
            });
        },
        setIcon(icon) {
            const t = this;
            t._current = icon;
            t._iconPreview.setAttribute('icon', icon);
            t.buildIconCode();
        },
        render() {
            const t = this;
            let perPage = t.perPage || 20;
            let page = t.page || 1;
            let startIndex = (page - 1) * perPage;
            if (startIndex > t._filteredKeys.length) {
                startIndex = 0;
            }
            let endIndex = startIndex + perPage;
            let pageIcons = t._filteredKeys.slice(startIndex, endIndex);
            t._bottomGrid.innerHTML = '';
            t._containers.length = 0;
            if (pageIcons.length === 0) {
                t.buildIconCode();
                return;
            }
            t.setIcon(pageIcons[0].name);
            t._containers.length = 0;
            pageIcons.forEach(icon => {
                const container = t.createIconContainer(icon);
                t._containers.push(container);
                t._bottomGrid.appendChild(container);
            });
            t.buildIconCode();
        },
        createIconContainer(data) {
            const t = this;
            let icon = data.name;
            let display = data.display || data.name;
            let container = webui.create('a', { style: 'flex-direction:column;' });
            container.icon = data;
            let el = webui.create('webui-icon', { icon: t.appendPipe(icon), width: '32' });
            container.appendChild(el);
            container.el = el;
            let label = webui.create('label', { text: display });
            container.appendChild(label);
            container.addEventListener('click', _ => {
                t.setIcon(icon);
            });
            return container;
        },
        async loadAllData() {
            await Promise.all([this.loadIcons(), this.loadEmojis()]);
            this.applyFilter();
        },
        async loadIcons() {
            const t = this;
            t._iconContainers = [];
            t._icons.length = 0;
            try {
                t._icons = await webui.fetchWithCache(`${srcRoot}all.json`, true);
                t._icons.forEach(icon => {
                    icon.display = icon.name.replace(/[-_]+/g, ' ');
                });
            } catch (ex) {
                console.error('Failed loading icons list', ex);
            }
        },
        async loadEmojis() {
            const t = this;
            t._emojis.length = 0;
            try {
                const _emojiMap = await webui.fetchWithCache(emojiSource, true);
                Object.keys(_emojiMap).forEach(key => t._emojis.push({
                    name: `emoji-${key}`,
                    display: key.replace(/[_]+/g, ' '),
                    tags: key
                }));
            } catch (ex) { console.error('Failed loading emojis', ex); }
        },
        shadowTemplate: `
<slot></slot>
<style type="text/css">
:host {

}
</style>`
    });
}
