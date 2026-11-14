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
    // The same reading as webui-icon: a shape before or after the icon name, as in circle_check or check_circle.
    const shapeNames = new Set(['circle', 'square', 'shield', 'triangle', 'tri', 'octo', 'octogon', 'badge', 'cloud', 'file', 'book', 'gear', 'chart', 'calendar', 'heart', 'note', 'scroll', 'window', 'tv']);
    function splitShape(name) {
        const first = name.indexOf('_');
        if (first > 0 && shapeNames.has(name.substring(0, first))) return [name.substring(first + 1), name.substring(0, first)];
        const last = name.lastIndexOf('_');
        if (last > 0 && !name.startsWith('emoji-') && shapeNames.has(name.substring(last + 1))) return [name.substring(0, last), name.substring(last + 1)];
        return [name, ''];
    }
    // A search matches icons whose name or tags hold every word, so "contact us" and "sign-in" work, and a plural
    // also finds the singular, so "reports" finds "report". Small words such as "us" and "the" are skipped.
    const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'to', 'for', 'my', 'your', 'our', 'us', 'with']);
    function singular(word) {
        if (word.length < 4 || word.endsWith('ss')) return word;
        if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
        if (/(x|ch|sh|ss)es$/.test(word)) return word.slice(0, -2);
        return word.endsWith('s') ? word.slice(0, -1) : word;
    }
    function searchWords(filter) {
        const words = filter.split(/[\s\-_]+/).filter(Boolean);
        const kept = words.filter(word => !stopWords.has(word));
        return (kept.length ? kept : words).map(word => [word, singular(word)]);
    }
    function searchText(icon) {
        if (icon._searchText === undefined) icon._searchText = `${icon.name.replace(/[-_]+/g, ' ')} ${icon.tags || ''}`.toLowerCase();
        return icon._searchText;
    }
    webui.define('webui-icon-search', {
        pipedValue: '',
        preload: "icon input-range input-text input-message pagination switch",
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
            t._modPath = 1;
            t._inputs = webui.create('webui-grid', { columns: '1fr 1fr', theme: 'background' });
            t.appendChild(t._inputs);
            t._svgContainer = webui.create('div', { style: 'display:block;position:relative;aspect-ratio:1;padding:0;margin:auto;width:50%;max-width:300px;' });
            t._inputs.appendChild(t._svgContainer);
            t._iconPreview = webui.create('webui-icon', { style: 'position:absolute;height:100%;top:0;left:0;' });
            t._svgContainer.appendChild(t._iconPreview);
            let icons = [];
            icons.push(t._iconPreview);
            let inputsColumn = webui.create('webui.flex', { column: '' });
            t._inputs.appendChild(inputsColumn);
            inputsColumn.appendChild(webui.create('h6', { html: `<strong>Icon Search</strong>` }));
            t._inputSearch = webui.create('webui-input-text', { 'label': `Search / Filter Icons`, value: '', placeholder: "menu" });
            t._pag = webui.create('webui-pagination', { loop: true, 'max-pages': 3 });
            t._pag.addEventListener('change', _ => { t.applyPagination(); });
            t._iconFlags = webui.create('webui-flex', { name: 'icon-options', justify: 'flex-start', align: 'center', wrap: true, gap: 5, html: `<h6 class="f1">Flags:</h6>` });
            inputsColumn.appendChild(t._iconFlags);
            // Each option is a switch of the current icon drawn with that choice, so you see what it does before picking it.
            // The empty choice, which leaves the attribute off, is stored in the switch as "none".
            const switchUpdates = [];
            function setupSwitch(key, label, attr, options, drawn) {
                // The label sits to the left, with the same width on every row, so the switches line up.
                const row = webui.create('webui-flex', { name: `icon-${attr}`, align: 'center', gap: 1 });
                row.appendChild(webui.create('h6', { class: 'f1', text: `${label}:`, style: 'margin:0;flex:0 0 auto;min-width:4.5rem;' }));
                // It starts on the empty choice. Without a value a switch shows its first option, which for Stroke is Thin, and
                // clicking that option would then change nothing.
                const sw = webui.create('webui-switch', { label: label, value: 'none', style: 'flex:1 1 0;min-width:0;' });
                row.appendChild(sw);
                inputsColumn.appendChild(row);
                const update = () => {
                    const icon = t._current || 'star';
                    sw.setAttribute('options', JSON.stringify(options.map(({ value, display }) => ({ value: value || 'none', label: display, icon: drawn(icon, value) }))));
                };
                switchUpdates.push(update);
                update();
                sw.addEventListener('change', _ => {
                    const value = sw.value === 'none' ? '' : sw.value;
                    icons.forEach(icon => {
                        if (!value) icon.removeAttribute(attr);
                        else icon.setAttribute(attr, value);
                    });
                    t.buildIconCode();
                });
                t[key] = sw;
            }
            t._updateSwitchIcons = () => switchUpdates.forEach(update => update());
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
            setupSwitch('_theme', 'Icon Theme', 'theme', JSON.parse(colorOptions), (icon, value) => `${icon}|fill${value ? `|theme:${value}` : ''}`);
            // Square is the shape an icon has without one, so it leaves the attribute off.
            setupSwitch('_shape', 'Shape', 'shape', [['', 'Square'], ['circle', 'Circle'], ['badge', 'Badge'], ['octo', 'Octogon'], ['triangle', 'Triangle'],
                ['shield', 'Shield'], ['heart', 'Heart'], ['gear', 'Gear'], ['cloud', 'Cloud'], ['file', 'File'], ['book', 'Book'],
                ['calendar', 'Calendar'], ['chart', 'Chart'], ['note', 'Note'], ['scroll', 'Scroll'], ['window', 'Window'], ['tv', 'TV']].map(([value, display]) => ({ value, display })),
                (icon, value) => `${value || 'square'}_${icon}|bordered`);
            setupSwitch('_stroke', 'Stroke', 'stroke', [
                { value: 'thin', display: 'Thin' },
                { value: '', display: 'Regular' },
                { value: 'thick', display: 'Thick' }
            ], (icon, value) => `${icon}${value ? `|stroke:${value}` : ''}`);
            // Shades show best on a filled icon.
            setupSwitch('_shade', 'Shade', 'shade', [
                { value: '', display: 'Regular' },
                { value: 'duo', display: 'Duo' },
                { value: 'tri', display: 'Trio' }
            ], (icon, value) => `${icon}|fill${value ? `|shade:${value}` : ''}`);
            t._rotate = webui.create('webui-input-range', { label: 'Rotation', min: 0, max: 355, step: 5, style: 'flex:1;' });
            {
                function inputUpdated() {
                    let value = parseInt(t._rotate.value) || 0;
                    icons.forEach(icon => {
                        if (value > 0) {
                            icon.setAttribute('rotate', value);
                        } else {
                            icon.removeAttribute('rotate');
                        }
                    });
                    t.buildIconCode();
                }
                t._rotate.addEventListener('input', inputUpdated);
                // Step to the next 15 degrees, looping, so left from 0 is 345 and right from 345 is 0.
                const step = direction => {
                    const value = parseInt(t._rotate.value) || 0;
                    let next = direction < 0
                        ? (value % 15 === 0 ? value - 15 : Math.floor(value / 15) * 15)
                        : Math.floor(value / 15) * 15 + 15;
                    next = ((next % 360) + 360) % 360;
                    t._rotate.value = next;
                    inputUpdated();
                };
                t.rotateStep = step;
                const rotateLeft = webui.create('webui-button', { 'start-icon': 'undo', 'aria-label': 'Rotate left 15 degrees', title: 'Rotate left 15 degrees' });
                const rotateRight = webui.create('webui-button', { 'start-icon': 'undo|flip', 'aria-label': 'Rotate right 15 degrees', title: 'Rotate right 15 degrees' });
                rotateLeft.addEventListener('click', _ => step(-1));
                rotateRight.addEventListener('click', _ => step(1));
                const rotateRow = webui.create('webui-flex', { align: 'center', gap: 1 });
                rotateRow.append(rotateLeft, t._rotate, rotateRight);
                inputsColumn.appendChild(rotateRow);
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
            t._codeSample = webui.create('webui-code', { 'language': 'html', 'label': `Icon Code` });
            inputsColumn.appendChild(t._codeSample);
            inputsColumn.appendChild(webui.create('p', { html: `Icon components also accept pipe delimited configurations, useful when passing icon data to parent components that pass icon values to child webui-icon components.` }));
            t._codeSamplePiped = webui.create('webui-code', { 'language': 'html', 'label': `Icon Code Piped` });
            inputsColumn.appendChild(t._codeSamplePiped);
            t._codePipedAttr = webui.create('webui-code', { 'language': 'html', 'label': `Icon Code Piped` });
            inputsColumn.appendChild(t._codePipedAttr);
            t._bottomGrid = webui.create('webui-grid', { gap: '1', theme: 'white', width: '100', height: '100' });
            t.appendChild(t._bottomGrid);
            t.loadAllData();
            t._inputSearch.addEventListener('input', _ => {
                t.page = 1;
                t.applyFilter();
            });
        },
        _searchDebounceTimer: null,
        _searchOpId: 0,
        async applyFilter() {
            const t = this;
            const cf = t.currentFilter;
            if (cf === t._cf) return;
            t._cf = cf;
            if (typeof t._inputSearch.value !== 'string') return;
            let filter = t._inputSearch.value.trim().toLowerCase();
            const searchHandler = t.customSearch || webui.iconSearchHandler || (t._emojiEnabled && webui.proxy?.searchEmojis ? (q) => webui.proxy.searchEmojis(q) : null);
            if (filter && t._emojiEnabled && typeof searchHandler === 'function') {
                const currentOpId = ++t._searchOpId;
                clearTimeout(t._searchDebounceTimer);
                t._searchDebounceTimer = setTimeout(async () => {
                    try {
                        const results = await searchHandler(filter, t);
                        if (t._searchOpId !== currentOpId) return;
                        if (Array.isArray(results) && results.length > 0) {
                            t._filteredKeys = results.map(item => {
                                if (typeof item === 'string') {
                                    return { name: item.startsWith('emoji-') ? item : `emoji-${item}`, display: item };
                                }
                                let key = item.shortcode || item.name || item.emoji;
                                let iconName = item.iconName || (key ? `emoji-${key.replace(/[\s-]+/g, '_').toLowerCase()}` : '');
                                return {
                                    name: iconName,
                                    display: item.display || item.name || key,
                                    tags: item.tags || key
                                };
                            });
                            t.totalCount = t._filteredKeys.length;
                            t.render();
                            return;
                        }
                    } catch (err) {
                        webui.log?.warn?.('Custom icon search failed, falling back to local filter:', err);
                    }
                    t.runLocalFilter(filter);
                }, 250);
                return;
            }
            t.runLocalFilter(filter);
        },
        runLocalFilter(filter) {
            const t = this;
            t._filteredKeys = [];
            let source = t._emojiEnabled ? t._emojis : t._icons;
            const words = filter ? searchWords(filter) : [];
            source.forEach(icon => {
                const text = words.length ? searchText(icon) : '';
                if (words.every(([word, single]) => text.includes(word) || text.includes(single))) {
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
            // Icons add these for screen readers themselves, so they do not belong in the code to copy.
            ico.removeAttribute('aria-hidden');
            if (ico.getAttribute('role') === 'img') ico.removeAttribute('role');
            if (ico.getAttribute('aria-label') === ico.getAttribute('title')) ico.removeAttribute('aria-label');
            // The shape goes before the icon name, as in circle_check, rather than in its own attribute.
            const shape = ico.getAttribute('shape') || '';
            t._pipeShape = shape;
            // The clone is a webui-icon, so setting its icon to circle_bell would add the shape attribute back.
            const name = ico.getAttribute('icon') || '';
            const shapedName = shape ? `${shape}_${name}` : name;
            ico.removeAttribute('shape');
            let code = ico.outerHTML.replace(`icon="${name}"`, `icon="${shapedName}"`);
            t._codeSample.value = code;
            let pipeData = [];
            pipeData.push(shapedName);
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
            if (t._pipeShape) name = `${t._pipeShape}_${name}`;
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
              t._iconPreview.removeAttribute(toggle.replace('_', '').replace('Toggle', ''));
          });
          ['_theme', '_shape', '_stroke', '_shade'].forEach(dd => {
              if (!t[dd]) return;
              t[dd].value = 'none';
              t._iconPreview.removeAttribute(dd.replace('_', ''));
          });
          if (t._rotate) {
              t._rotate.value = 0;
              t._iconPreview.removeAttribute('rotate');
          }
        },
        async setIconFromCode(pipedValue) {
          const t = this;
          // The preview is made once the icon list loads, which can be after a page sets an icon.
          while (!t._iconPreview) {
              await webui.wait(10);
          }
          t.resetOptions();
          let pipedData = (pipedValue || '').split('|');
          let [icon, shape] = splitShape(pipedData.shift() || '');
          if (shape) pipedData.unshift(`shape:${shape}`);
          pipedData.forEach(segment => {
              if (segment.indexOf(':') !== -1) {
                  let kv = segment.split(':');
                  let dd = t[`_${kv[0]}`];
                  if (kv[0] === 'shape') kv[1] = { tri: 'triangle', octogon: 'octo' }[kv[1]] || kv[1];
                  if (dd) {
                      dd.value = kv[1];
                  }
                  t._iconPreview.setAttribute(kv[0], kv[1]);
              } else {
                  let toggle = t[`_${segment}Toggle`];
                  if (toggle) {
                      toggle.value = true;
                  }
                  t._iconPreview.setAttribute(segment, '');
              }
          });
          t.setIcon(icon);
        },
        async setIcon(icon) {
            const t = this;
            t._current = icon;
            while (!t._iconPreview) {
                await webui.wait(10);
            }
            t._iconPreview.setAttribute('icon', icon);
            t._updateSwitchIcons?.();
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
            this.applyPagination();
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
            let emojis = [];
            try {
                const _emojiMap = await webui.fetchWithCache(emojiSource, true);
                Object.keys(_emojiMap).forEach(key => emojis.push({
                    name: `emoji-${key}`,
                    display: key.replace(/[_]+/g, ' '),
                    tags: key
                }));
                t._emojis = emojis;
                if (webui.proxy?.initEmojiSearch) {
                    webui.proxy.initEmojiSearch(Object.keys(_emojiMap));
                }
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
