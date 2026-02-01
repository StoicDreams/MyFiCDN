/*!
 * Web UI Emoji Search - https://webui.stoicdreams.com/components#webui-emoji-search
 * A component for searching and displaying emojis within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    const emojiSource = webui.getData('appName') === 'My Fidelity CDN' ? '/i/emojis.json' : 'https://cdn.myfi.ws/i/emojis.json';
    webui.define("webui-emoji-search", {
        linkCss: false,
        preload: 'pagination input-range flex grid input-text',
        _filteredKeys: [],
        constructor() {
            const t = this;
            t._search = t.template.querySelector('[label="Search"]');
            t._size = t.template.querySelector('[label="Size"]');
            t._grid = t.template.querySelector('.grid');
            t._pag = t.template.querySelector('webui-pagination');
            t._pag.addEventListener('change', _ => { t.applyPagination(); })
        },
        applyPagination() {
            const t = this;
            let id = webui.uuid();
            t._apid = id;
            setTimeout(async () => {
                if (t._apid !== id) return;
                if (!t._pag) return;
                webui.waitForConstruction(t._pag, _ => {
                    t.render();
                });
            }, 10);
        },
        props: {
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
                get() { return t._pag.pageCount; }
            },
            'totalCount': {
                get() { return this._pag.totalCount; },
                set(v) {
                    const t = this;
                    t._pag.totalCount = v;
                }
            }
        },
        attr: ['height', 'max-height'],
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'height':
                    t.style.height = webui.pxIfNumber(value);
                    break;
                case 'maxHeight':
                    t.style.maxHeight = webui.pxIfNumber(value);
                    break;
            }
        },
        applyStyles() {
            const t = this;
            t.style.setProperty('--font-size', `${t._size.value}em`);
        },
        connected() {
            const t = this;
            t._size.addEventListener('change', _ => {
                t.applyStyles();
            });
            let timer;
            t._search.addEventListener('input', _ => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    t._filter = t._search.value.trim();
                    t.applyFilter();
                    t.render();
                }, 300);
            });
            let size = webui.getData('session-emoji-search-size');
            if (!size) {
                size = 2;
                webui.setData('session-emoji-search-size', size);
            }
            t._size.value = size;
            t.setAttribute('data-subscribe', 'session-emoji-search-index:page');
            let page = webui.getData('session-emoji-search-index:page');
            if (!page) {
                webui.setData('session-emoji-search-index', 1);
            }
            webui.fetchWithCache(emojiSource, true).then(emojis => {
                t.emojis = emojis;
                t.applyFilter();
                t.render();
            });
        },
        applyFilter() {
            const t = this;
            if (typeof t._search.value !== 'string') return;
            let filter = t._search.value.trim();
            t._filteredKeys = [];
            Object.keys(t.emojis).forEach(key => {
                if (filter && key.indexOf(filter.toLowerCase()) === -1) return;
                t._filteredKeys.push(key);
            });
            t.totalCount = t._filteredKeys.length;
        },
        render() {
            const t = this;
            if (!t.emojis) { return; }
            t._grid.innerText = '';
            let perPage = t.perPage || 20;
            let page = t.page || 1;
            let startIndex = (page - 1) * perPage;
            if (startIndex > t._filteredKeys.length) {
                startIndex = 0;
            }
            let endIndex = startIndex + perPage;
            t._filteredKeys.slice(startIndex, endIndex).forEach(key => {
                const code = `:${key}:`;
                let el = webui.create('a', { title: code, html: t.emojis[key] });
                t._grid.appendChild(el);
                el.addEventListener('click', ev => {
                    ev.stopPropagation();
                    ev.preventDefault();
                    webui.copyToClipboard(code);
                });
            });
            t.applyStyles();
        },
        shadowTemplate: `
<webui-flex gap="10">
<webui-input-text label="Search"></webui-input-text>
<webui-input-range label="Size" min="1" max="5" step="0.5" data-subscribe="session-emoji-search-size:setValue" data-trigger="session-emoji-search-size"></webui-input-range>
</webui-flex>
<webui-pagination class="my-a" data-subscribe="session-emoji-search-index:setValue" loop max-pages="3"></webui-pagination>
<webui-flex wrap gap="20" justify="center" class="pa-1 grid" theme="inherit"></webui-flex>
<style type="text/css">
:host {
display:block;
overflow:auto;
overflow-x:hidden;
}
a {
display:block;
font-size:var(--font-size);
aspect-ratio:1;
width:var(--font-size);
cursor:pointer;
}
webui-flex {
width:100%;
}
</style>
<slot></slot>
<slot name="something"></slot>
`
    });
}
