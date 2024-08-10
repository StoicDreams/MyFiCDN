"use strict"
{
    const srcRoot = webui.getData('appName') === 'MyFi CDN' ? '/icons/' : 'https://cdn.myfi.ws/icons/';
    webui.define('webui-icon-creator', {
        preload: "icon dropdown",
        constructor: (t) => {
            t._topGrid = webui.create('webui-grid', { columns: '1fr 1fr', gap: '1' });
            t._leftGrid = webui.create('webui-grid', { gap: '1', theme: 'black', width: '100', height: '100' });
            t._rightGrid = webui.create('webui-grid', { gap: '1', theme: 'white', width: '100', height: '100' });
            t._topGrid.appendChild(t._leftGrid);
            t._topGrid.appendChild(t._rightGrid);
            let icons = [];
            [{ l: 'Regular', d: {} },
            { l: 'Inverted', d: { inverted: '' } },
            { l: 'Thin', d: { thin: '' } },
            { l: 'Thick', d: { thick: '' } },
            { l: 'Square', d: { square: '' } },
            { l: 'Circle', d: { circle: '' } },
            { l: 'Bordered Square', d: { square: '', bordered: '' } },
            { l: 'Bordered Circle', d: { circle: '', bordered: '' } },
            { l: 'Duo-Tone', d: { duo: '' } },
            { l: 'Tri-Tone', d: { tri: '' } }].forEach(def => {
                let attributes = def.d;
                attributes.width = '100px';
                attributes.class = 'my-1';
                let iconLeft = webui.create('webui-icon', attributes);
                let iconRight = webui.create('webui-icon', attributes);
                icons.push(iconLeft);
                icons.push(iconRight);
                let left = webui.create('webui-flex', { column: '1' });
                let right = webui.create('webui-flex', { column: '1' });
                t._leftGrid.appendChild(left);
                left.appendChild(iconLeft);
                left.appendChild(webui.create('label', { text: def.l, class: 'text-center' }));
                t._rightGrid.appendChild(right);
                right.appendChild(iconRight);
                right.appendChild(webui.create('label', { text: def.l, class: 'text-center' }));
            });
            t._color = webui.create('webui-dropdown', { 'label': 'Icon Theme' });
            t._color.addEventListener('change', _ => {
                let theme = t._color.value;
                t._topGrid.querySelectorAll('webui-icon').forEach(icon => {
                    if (!theme) {
                        icon.removeAttribute('theme');
                    } else {
                        icon.setAttribute('theme', theme);
                    }
                });
            });
            t._input = webui.create('webui-input-message', { 'label': `Definition`, value: 'WEBUI-ICON-DEF\n', placeholder: "WEBUI-ICON-NAME" });
            t._input.addEventListener('input', _ => {
                let value = t._input.value;
                if (!value) {
                    t._input.value = 'WEBUI-ICON-DEF';
                    return;
                }
                icons.forEach(icon => {
                    icon.setIconDefinition(value);
                });
            });
            t._bottomGrid = webui.create('webui-grid', { gap: '1', theme: 'inherit', width: '100', height: '100' });
        },
        connected: (t) => {
            t.style.display = 'flex';
            t.style.flexDirection = 'column';
            t.style.flexGap = 'var(--padding)';
            t.appendChild(t._topGrid);
            t.appendChild(t._color);
            t.appendChild(t._input);
            t.appendChild(t._bottomGrid);
            t.loadIcons();
            let options = JSON.stringify([
                { value: '', display: 'None' },
                { value: 'black', display: 'Black' },
                { value: 'white', display: 'White' },
                { value: 'site', display: 'Site' },
                { value: 'title', display: 'Title' },
                { value: 'primary', display: 'Primary' },
                { value: 'secondary', display: 'Secondary' },
                { value: 'tertiary', display: 'Tertiary' },
                { value: 'info', display: 'info' },
                { value: 'success', display: 'success' },
                { value: 'warning', display: 'warning' },
                { value: 'danger', display: 'danger' },
                { value: 'shade', display: 'Shade' },
                { value: 'active', display: 'Active' },
                { value: 'button', display: 'Button' },
                { value: 'action', display: 'Action' },
                { value: 'footer', display: 'Footer' }
            ]);
            t._color.setAttribute('options', options);
        },
        loadFromDefinition: function (iconDef) {
            let t = this;
            if (!iconDef) return;
        },
        loadIcons: async function () {
            let t = this;
            try {
                let result = await fetch(`${srcRoot}all.json`);
                if (!result.ok) return;
                let icons = await result.json();
                icons.forEach(icon => {
                    let container = webui.create('a', { style: 'flex-direction:column;' });
                    t._bottomGrid.appendChild(container);
                    let el = webui.create('webui-icon', { icon: icon, width: '100' });
                    container.appendChild(el);
                    let label = webui.create('label', { text: icon });
                    container.appendChild(label);
                    container.addEventListener('click', _ => {
                        t._input.value = el._definition;
                        t._input.dispatchEvent(new Event('input', { bubbles: true }));
                    });
                });
            } catch (ex) {
                console.error('Failed loading icons list', ex);
            }
        }
    });
}
