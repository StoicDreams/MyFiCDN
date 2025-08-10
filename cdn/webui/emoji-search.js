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
        preload: 'input-range grid input-text',
        _page: 1,
        _perPage: 20,
        _filteredKeys: [],
        constructor: (t) => {
            t._search = t.template.querySelector('[label="Search"]');
            t._size = t.template.querySelector('[label="Size"]');
            t._grid = t.template.querySelector('.grid');
            t._pag = t.template.querySelector('webui-pagination');
        },
        props: {
            'page': {
                get() { return this._page; },
                set(v) {
                    this._page = v;
                    this._pag.page = v;
                    this.render();
                }
            },
            'perPage': {
                get() { return this._perPage; },
                set(v) {
                    this._perPage = v;
                    this.t._pag.perPage = v;
                }
            },
            'pageCount': {
                get() { return Math.floor(this._filteredKeys.length / this.perPage); }
            },
            'totalCount': {
                get() { return this._totalCount; },
                set(v) {
                    this._totalCount = v;
                    this._pag.totalCount = v;
                    this._pag.pageCount = this.pageCount;
                    if (this.page > this.pageCount) {
                        this.page = this.pageCount;
                    }
                }
            }
        },
        attr: ['height', 'max-height'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'height':
                    t.style.height = webui.pxIfNumber(value);
                    break;
                case 'maxHeight':
                    t.style.maxHeight = webui.pxIfNumber(value);
                    break;
            }
        },
        connected: function (t) {
            webui.fetchWithCache(emojiSource, true).then(emojis => {
                t.emojis = emojis;
                t.applyFilter();
                t.render();
            });
            t._search.addEventListener('input', _ => {
                t._filter = t._search.value.trim();
                t.applyFilter();
                t.render();
            });
            t._size.addEventListener('change', _ => {
                t.style.setProperty('--font-size', `${t._size.value}em`);
            });
            let size = webui.getData('session-emoji-search-size');
            if (!size) {
                webui.setData('session-emoji-search-size', 2);
            }
            t.setAttribute('data-subscribe', 'session-emoji-search-index:page');
        },
        applyFilter: function () {
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
        render: function () {
            const t = this;
            if (!t.emojis) { return; }
            t._grid.innerText = '';
            let index = 0;
            let perPage = t.perPage || 20;
            let page = t.page || 1;
            let startIndex = (page - 1) * perPage;
            if (startIndex > t._filteredKeys.length) {
                startIndex = 0;
            }
            let endIndex = startIndex + perPage;
            t._filteredKeys.forEach(key => {
                if (index++ < startIndex || index > endIndex) return;
                const code = `:${key}:`;
                let el = webui.create('a', { title: code, html: t.emojis[key] });
                t._grid.appendChild(el);
                el.addEventListener('click', ev => {
                    ev.stopPropagation();
                    ev.preventDefault();
                    webui.copyToClipboard(code);
                })
            });
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
ratio:1;
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
