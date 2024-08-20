"use strict"
{
    const srcRoot = webui.getData('appName') === 'MyFi CDN' ? '/icons/' : 'https://cdn.myfi.ws/icons/';
    webui.define('webui-icon-search', {
        preload: "icon dropdown",
        constructor: (t) => {
        },
        attr: [],
        attrChanged: (t, property, value) => {

        },
        connected: (t) => {
            t.setupComponent();
        },
        setupComponent: function () {
            let t = this;
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
                { value: 'triangle', display: 'Triangle' },
                { value: 'octo', display: 'Octogon' },
            ]);
            t._modPath = 1;
            t._inputs = webui.create('webui-grid', { columns: '1fr 1fr', theme: 'background' });
            t.appendChild(t._inputs);
            t._svgContainer = webui.create('div', { style: 'display:block;position:relative;aspect-ratio:1;padding:0;margin:0;' });
            t._inputs.appendChild(t._svgContainer);
            t._iconPreview = webui.create('webui-icon', { style: 'position:absolute;width:100%;top:0;left:0;' });
            t._svgContainer.appendChild(t._iconPreview);
            let icons = [];
            icons.push(t._iconPreview);
            t._icons = icons;
            let inputsColumn = webui.create('webui.flex', { column: '' });
            t._inputs.appendChild(inputsColumn);
            inputsColumn.appendChild(webui.create('h6', { html: `<strong>Icon Search</strong>` }));
            t._inputSearch = webui.create('webui-input-text', { 'label': `Search / Filter Icons`, value: '', placeholder: "menu" });
            t._iconFlags = webui.create('webui-flex', { name: 'icon-options', justify: 'flex-start', align: 'center', wrap: true, html: `<h6 class="f1">Flags:</h6>` });
            inputsColumn.appendChild(t._iconFlags);
            function setupDropdown(label, attr, options) {
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
            }
            function setupToggleIcon(name, label, flagAttr) {
                t[name] = webui.create('webui-toggle-icon', { label: label, 'title-on': `Disable ${label}`, 'title-off': `Enable ${label}`, 'theme-on': 'success', 'theme-off': 'shade', 'flags-on': 'fill', 'flags-off': '' });
                t[name].addEventListener('change', _ => {
                    icons.forEach(icon => {
                        if (t[name].value) {
                            icon.setAttribute(flagAttr, '');
                        } else {
                            icon.removeAttribute(flagAttr);
                        }
                    });
                    t.buildIconCode();
                });
                t._iconFlags.appendChild(t[name]);
            }
            setupDropdown('Icon Theme', 'theme', colorOptions);
            setupDropdown('Shape', 'shape', shapeOptions);
            setupDropdown('Stroke', 'stroke', JSON.stringify([
                { value: '', display: 'Regular' },
                { value: 'thin', display: 'Thin' },
                { value: 'thick', display: 'Thick' }
            ]));
            setupDropdown('Shade', 'shade', JSON.stringify([
                { value: '', display: 'Regular' },
                { value: 'duo', display: 'Duo' },
                { value: 'tri', display: 'Trio' }
            ]));
            setupToggleIcon('_backingToggle', 'Backing', 'backing');
            setupToggleIcon('_sharpToggle', 'Sharp', 'sharp');
            setupToggleIcon('_fillToggle', 'Fill', 'fill');
            setupToggleIcon('_borderToggle', 'Bordered', 'bordered');
            setupToggleIcon('_banToggle', 'Ban', 'ban');
            setupToggleIcon('_invertToggle', 'Inverted', 'inverted');
            t.appendChild(t._inputSearch);
            t._codeSample = webui.create('webui-code', { 'lang': 'html', 'label': `Icon Code` });
            inputsColumn.appendChild(t._codeSample);
            inputsColumn.appendChild(webui.create('p', { html: `Icon components also accept pipe delimited configurations, useful when passing icon data to parent components that pass icon values to child webui-icon components.` }));
            t._codeSamplePiped = webui.create('webui-code', { 'lang': 'html', 'label': `Icon Code Piped` });
            inputsColumn.appendChild(t._codeSamplePiped);
            t._bottomGrid = webui.create('webui-grid', { gap: '1', theme: 'white', width: '100', height: '100' });
            t.appendChild(t._bottomGrid);
            t.loadIcons();
            t._inputSearch.addEventListener('input', _ => {
                t.updateDisplayedIcons();
            })
        },
        buildIconCode: function () {
            let t = this;
            let ico = t._icons[0].cloneNode();
            ico.removeAttribute('style');
            let code = ico.outerHTML;
            t._codeSample.value = code;
            let pipeData = [];
            pipeData.push(ico.getAttribute('icon'));
            ico.getAttributeNames().forEach(attr => {
                switch (attr) {
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
            t._codeSamplePiped.value = `<webui-icon icon="${pipeData.join('|')}"></webui-icon>`;
        },
        setIcon: function (icon) {
            let t = this;
            t._current = icon;
            t._icons[0].setAttribute('icon', icon);
            t.buildIconCode();
        },
        updateDisplayedIcons: function () {
            let t = this;
            let isFirst = true;
            let filter = t._inputSearch.value;
            if (typeof filter === 'string') {
                filter = filter.toLowerCase();
            } else {
                filter = '';
            }
            let current = t._current;
            let valid = [];
            function setIsFirst(icon) {
                valid.push(icon);
                if (isFirst) {
                    isFirst = false;
                    setTimeout(() => {
                        if (valid.indexOf(current) === -1) {
                            t.setIcon(icon);
                        }
                    }, 100);
                }
            }
            t._iconContainers.forEach(c => {
                let icon = c.icon.name;
                if (!filter) {
                    t._bottomGrid.appendChild(c);
                    setIsFirst(icon);
                    return;
                }
                let tags = c.icon.tags.split(' ');
                if (icon.toLowerCase().indexOf(filter) !== -1) {
                    t._bottomGrid.appendChild(c);
                    setIsFirst(icon);
                    return;
                }
                let isMatched = false;
                tags.forEach(tag => {
                    if (isMatched) return;
                    if (tag.toLowerCase().indexOf(filter) !== -1) {
                        isMatched = true;
                        t._bottomGrid.appendChild(c);
                        setIsFirst(icon);
                    }
                });
                if (!isMatched) {
                    if (c.parentNode && c.parentNode.removeChild) {
                        c.parentNode.removeChild(c);
                    }
                }
            });
            t.buildIconCode();
        },
        loadIcons: async function () {
            let t = this;
            t._iconContainers = [];
            try {
                let result = await fetch(`${srcRoot}all.json`);
                if (!result.ok) return;
                let icons = await result.json();
                let isFirst = true;
                icons.forEach(data => {
                    let icon = data.name;
                    let container = webui.create('a', { style: 'flex-direction:column;' });
                    container.icon = data;
                    t._iconContainers.push(container);
                    t._bottomGrid.appendChild(container);
                    let el = webui.create('webui-icon', { icon: `${icon}`, width: '32' });
                    container.appendChild(el);
                    t._icons.push(el);
                    let label = webui.create('label', { text: icon });
                    container.appendChild(label);
                    container.addEventListener('click', _ => {
                        t.setIcon(icon);
                    });
                });
                t.updateDisplayedIcons();
            } catch (ex) {
                console.error('Failed loading icons list', ex);
            }
        },
        shadowTemplate: `
<slot></slot>
<style type="text/css">
:host {

}
</style>`
    });
}
