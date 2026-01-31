/*!
 * Web UI Pagination - https://webui.stoicdreams.com/components#webui-pagination
 * A component for displaying and managing pagination controls within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    webui.define('webui-pagination', {
        preload: "button",
        _pageCount: 0,
        _totalCount: 0,
        constructor() {
            const t = this;
            t._input = t.template.querySelector('input');
            t._slot = t.template.querySelector('slot');
            t._prev = t.template.querySelector('div.prev');
            t._pages = t.template.querySelector('div.pages');
            t._next = t.template.querySelector('div.next');
            t._btnFirst = t.template.querySelector('webui-button.first');
            t._btnPrev = t.template.querySelector('webui-button.prev');
            t._btnNext = t.template.querySelector('webui-button.next');
            t._btnLast = t.template.querySelector('webui-button.last');
            t._total = t.template.querySelector('.total > strong');
            t._data = undefined;
            t.perPage = 1;
            t._index = 0;
            t.page = 1;
            t._input.value = 1;
            t._btnFirst.addEventListener('click', _ => {
                if (t.page === 1) return;
                t.setValue(1);
            });
            t._btnPrev.addEventListener('click', _ => {
                if (t.page > 1) {
                    t.setValue(t.page - 1);
                } else if (t.loop !== undefined) {
                    t.setValue(t.pageCount);
                }
            });
            t._btnNext.addEventListener('click', _ => {
                if (t.page < t.pageCount) {
                    t.setValue(t.page + 1);
                } else if (t.loop !== undefined) {
                    t.setValue(1);
                }
            });
            t._btnLast.addEventListener('click', _ => {
                if (t.page === t.pageCount) return;
                t.setValue(t.pageCount);
            });
            t._input.addEventListener('input', _ => {
                let page = parseInt(t._input.value) || t.page;
                if (page !== t.page) {
                    t.setValue(page);
                    if (t._input.value !== t.page) {
                        t._input.value = t.page;
                    }
                }
            });
        },
        props: {
            'totalCount': {
                get() { return this._totalCount; },
                set(v) {
                    if (!v || this._totalCount !== v) return;
                    this._totalCount = v;
                    this._total.innerText = v.toLocaleString('en-US');
                    this.process();
                }
            },
            'pageCount': {
                get() { return this._pageCount; },
                set(v) {
                    if (this._pageCount === v) return;
                    this._pageCount = v;
                    this.setAttribute('page-count', v);
                    this.process();
                }
            }
        },
        attr: ['data-current', 'data-subscribe', 'value', 'page', 'per-page', 'hide-prev-next-buttons', 'hide-pages', 'loop', 'max-pages'],
        attrChanged(property, value) {
            const t = this;
            switch (property) {
                case 'perPage':
                    let num = parseInt(value);
                    if (`${num}` === value) {
                        t.perPage = num;
                    }
                    break;
                case 'page':
                case 'value':
                    t.setValue(value || 1);
                    break;
                case 'maxPages':
                    t.maxPages = parseInt(value) || 0;
                    break;
            }
        },
        connected() {
            const t = this;
            let data = '';
            if (t._slot.assignedElements().length) {
                let ch = [];
                t._slot.assignedElements().forEach(node => {
                    ch.push(node.innerText);
                });
                data = ch.join('\n');
                t.setData(data);
            }

            let ds = t.dataset.subscribe;
            if (!ds) return;
            ds.split('|').forEach(ds => {
                let kt = ds.split(':');
                if (kt.length !== 2) return;
                if (kt[1] === 'setData') {
                    let attempts = 0;
                    function tryGetData() {
                        if (t._data && t._data.length) return;
                        data = webui.getData(kt[0]);
                        if (data) {
                            t.setData(data);
                        } else if (++attempts < 5) {
                            setTimeout(() => tryGetData(), 100 * attempts);
                        }
                    }
                    tryGetData();
                }
            });
            t.process();
        },
        process() {
            const t = this;
            if (t._data && t._data.forEach) {
                let current = t._currentData || {};
                if (t._data.length === 0) {
                    t.pageCount = 0;
                    t.totalCount = 0;
                    if (t.dataCurrent) {
                        webui.setData(t.dataCurrent, current);
                    }
                    return;
                }
                t.page = t.page;
                t.pageCount = Math.ceil(t._data.length / t.perPage);
                t.totalCount = t._data.length;
                if (t.page > t.pageCount) {
                    t.page = t.pageCount;
                    t._index = t.page - 1;
                    t.value = t.page;
                }
                if (t.perPage === 1) {
                    current = t._data[t._index];
                } else {
                    current = [];
                    for (let index = t._index; index < t._data.length; ++index) {
                        current.push(t._data[index]);
                    }
                }
                t._currentData = current;
                webui.setData(t.dataCurrent, current);
            }
            if (t.dataset.subscribe) {
                t.dataset.subscribe.split('|').forEach(ds => {
                    let dk = ds.split(':');
                    if (dk.length === 1) return;
                    if (dk[1] === 'setValue') {
                        webui.setData(dk[0], t.page);
                    }
                });
            }
            t.render();
        },
        render() {
            const t = this;
            if (!t.hasChanges) return;
            if (t.page === 1) {
                t._btnFirst.setAttribute('disabled', 'true');
            } else {
                t._btnFirst.removeAttribute('disabled');
            }
            if (t.page === t.pageCount) {
                t._btnLast.setAttribute('disabled', 'true');
            } else {
                t._btnLast.removeAttribute('disabled');
            }
            t._input.value = t.page || 1;
            let cw = `${t.page}`.length + 5;
            t._input.style.width = `${cw}ch`;
            t._pages.querySelectorAll('webui-button').forEach(b => b.remove());
            if (!t.hidePages && t.maxPages !== 0) {
                let mp = t.maxPages === undefined ? 10 : Math.abs(t.maxPages);
                let pl = Math.floor(mp / 2);
                let ps = t.page - pl;
                if (ps < 1) {
                    ps = 1;
                }
                let pr = ps + mp - 1;
                if (pr > t.pageCount) {
                    pr = t.pageCount;
                    if (ps > 1) {
                        ps = Math.max(1, pr - (mp - 1));
                    }
                }
                for (let pn = ps; pn <= pr; ++pn) {
                    if (pn === t.page) {
                    } else {
                        let pageNumber = pn;
                        let page = webui.create('webui-button', { html: `${pageNumber}` });
                        page.addEventListener('click', _ => {
                            t.setValue(pageNumber);
                        });
                        if (pageNumber < t.page) {
                            t._pages.insertBefore(page, t._input);
                        } else {
                            t._pages.appendChild(page);
                        }
                    }
                }
            }
            t._hasRendered = true;
        },
        setValue(value, key, toSet) {
            const t = this;
            value = value || 1;
            if (value === undefined || value === undefined) return;
            if (typeof value === 'string') {
                value = parseInt(value) || 1;
            }
            if (typeof value !== 'number') return;
            if (value < 1) {
                value = 1;
            }
            if (value === t.page && t._hasRendered) return;
            t.page = value;
            t._index = t.page - 1;
            t.value = t.page;
            t.process();
        },
        setData(value) {
            const t = this;
            if (typeof value === 'string') {
                try {
                    if (!value) {
                        t._data = [];
                        t.totalCount = 0;
                    } else {
                        value = JSON.parse(value);
                    }
                } catch (ex) {
                    return;
                }
            }
            if (value === undefined || value === null) {
                if (t._data !== undefined) {
                    t._data = undefined;
                    t.process();
                }
                return;
            }
            if (!value.forEach) {
                value = [value];
            }
            if (JSON.stringify(t._data) === JSON.stringify(value)) return;
            if (t._data !== value) {
                t._data = value;
                t.process();
            }
        },
        shadowTemplate: `
<div class="spacer-left"></div>
<div class="prev">
<webui-button class="first" start-icon="caret-line|has-shadow:true|rotate:270|fill"></webui-button>
<webui-button class="prev" start-icon="caret|has-shadow:true|rotate:270|fill"></webui-button>
</div>
<div class="pages">
<input type="number" value="1" min="1" />
</div>
<div class="next">
<webui-button class="next" start-icon="caret|has-shadow:true|rotate:90|fill"></webui-button>
<webui-button class="last" start-icon="caret-line|has-shadow:true|fill|rotate:90"></webui-button>
</div>
<div class="spacer-right"></div>
<div class="total"><span>Total: </span><strong>0</strong></div>
<pre><slot></slot></pre>
<style type="text/css">
:host {
display:grid;
grid-template-columns:auto max-content max-content max-content 0;
gap:var(--padding);
}
:host([page-count="2"]) .first,
:host([page-count="2"]) .last,
:host([page-count="3"]) .first,
:host([page-count="3"]) .last,
:host([page-count="4"]) .first,
:host([page-count="4"]) .last,
:host([page-count="1"]) .prev,
:host([page-count="1"]) .next,
:host([page-count="0"]),
:host(:not([page-count])) {
display:none;
}
div.prev,
div.pages,
div.next {
display:flex;
gap:var(--padding);
}
div.total {
display:flex;
grid-column:1/5;
align-items: center;
justify-content: right;
}
div.total > span {
padding: 0 0.5ch 0 0;
}
input[type="number"] {
background-color:color-mix(in srgb, var(--theme-color) 80%, white);
color:var(--theme-color-offset);
border:none;
box-sizing:border-box;
padding:var(--padding);
text-align:center;
border-radius:var(--corners);
}
:host([page-count="1"]) input[type="number"] {
cursor:default;
pointer-events:none;
}
:host([page-count="1"]) .pages {
display:none;
}
pre {display:none;}
</style>`
    });
}
