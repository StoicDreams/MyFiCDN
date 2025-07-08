/* Display Data in Table */
{
    function getAlign(val) {
        let flagStart = 0, flagEnd = 0;
        val = val.trim();
        if (val[0] === ':') {
            flagStart = 1;
            val = val.substr(1);
        }
        if (val.substr(val.length - 1) === ':') {
            flagEnd = 1;
            val = val.substr(0, val.length - 1);
        }
        return [val.trim(), flagStart ? flagEnd ? 'text-center' : 'text-left' : flagEnd ? 'text-right' : 'text-justify'];
    }
    webui.define('webui-table', {
        _columns: [],
        linkCss: true,
        constructor: (t) => {
            t._table = webui.create('table');
            t._columnTemplates = {};
            webui.removeElements(t, '[slot="column"]', n => {
                let key = n.dataset.name || n.dataset.key || n.getAttribute('name') || n.getAttribute('key');
                if (key === undefined) return;
                t._columnTemplates[key] = n.innerHTML;
            });
        },
        attr: ['bordered', 'columns', 'sortable', 'current-sort', 'current-sort-dir'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'bordered':
                    t._table.classList.add('bordered');
                    break;
                case 'columns':
                    t._columns = [];
                    value.split(';').forEach(c => {
                        c = c.trim();
                        if (c) {
                            t._columns.push(webui.replaceAppData(c));
                        }
                    });
                    t.render();
                    break;
            }
        },
        setData: function (data) {
            const t = this;
            data = data || {};
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }
            let json = JSON.stringify(data);
            if (t._dataJson === json) return;
            t._dataJson = json;
            t._data = data;
            t.render();
        },
        render: function () {
            const t = this;
            t._table.innerHTML = '';
            let h = webui.create('tr');
            t._table.appendChild(h);
            let sortable = {};
            if (t.sortable) {
                t.sortable.split(';').forEach(col => {
                    col = col.split(':');
                    let dsb = col.length > 1 ? col[1] : 'asc';
                    if (col.length > 2) {
                        t.defaultSort = col[0];
                        t.defaultSortDir = dsb;
                    }
                    col = col[0];
                    sortable[col] = dsb;
                    if (!t.defaultSort) {
                        t.defaultSort = col;
                        t.defaultSortDir = dsb;
                    }
                });
                if (t.defaultSort && !t.currentSort) {
                    t.currentSort = t.defaultSort;
                    t.currentSortDir = t.defaultSortDir;
                }
            }
            t._columns.forEach(col => {
                let cs = col.split('|');
                let [display, align] = getAlign(cs[0].trim());
                let key = cs.length > 1 ? cs[1].trim() : display;
                let th = webui.create('th', { 'class': align });
                let isSortable = sortable[key];
                if (isSortable) {
                    let flexAlign = align === 'text-center' ? 'center' : align === 'text-right' ? 'right' : 'left';
                    let c = webui.create('webui-flex', { align: 'center', justify: flexAlign, gap: 1, class: 'no-select' });
                    c.style.cursor = 'pointer';
                    c.appendChild(webui.create('span', { html: display }));
                    if (t.currentSort === key) {
                        let ico = webui.create('webui-icon', { icon: t.currentSortDir === 'asc' ? "caret|has-shadow:true|fill|rotate:0" : "caret|has-shadow:true|fill|rotate:180" });
                        c.appendChild(ico);
                    }
                    c.addEventListener('click', _ => {
                        let sortDir = t.currentSort === key ? t.currentSortDir === 'asc' ? 'desc' : 'asc' : sortable[key];
                        t.currentSort = key;
                        t.currentSortDir = sortDir;
                        t.dispatchEvent(new Event('update-sort', { bubbles: true, composed: true }));
                    });
                    th.appendChild(c);
                } else {
                    th.innerHTML = webui.replaceAppData(display);
                }
                h.appendChild(th);
            });
            if (t._data && t._data.forEach) {
                t._data.forEach(row => {
                    if (!row._rowId) {
                        row._rowId = webui.toCamel(webui.uuid()).toLowerCase();
                        webui.setData(`page-tr-${row._rowId}`, row);
                    }
                    let tr = webui.create('tr');
                    t._table.appendChild(tr);
                    t._columns.forEach(col => {
                        col = col.trim();
                        let cd = col.split('|');
                        let [cm, align] = getAlign(cd[0]);
                        if (cd.length === 2) {
                            cm = cd[1].trim();
                        }
                        let cc = webui.toCamel(cm);
                        let pc = webui.toPascel(cm);
                        let td = webui.create('td', { class: align });
                        tr.appendChild(td);
                        if (t._columnTemplates[cm]) {
                            td.innerHTML = webui.replaceAppData(t._columnTemplates[cm], row);
                        } else if (t._columnTemplates[cc]) {
                            td.innerHTML = webui.replaceAppData(t._columnTemplates[cc], row);
                        } else if (t._columnTemplates[pc]) {
                            td.innerHTML = webui.replaceAppData(t._columnTemplates[pc], row);
                        } else {
                            let data = webui.getDefined(row[cm], row[cc], row[pc], '');
                            td.innerHTML = webui.replaceAppData(`${data}`);
                        }
                    });
                });
            }
        },
        connected: (t) => {
            t.appendChild(t._table);
            t.render();
            setTimeout(() => {
                if (t.dataset.subscribe) {
                    let data = webui.getData(t.dataset.subscribe);
                    if (data !== t._data) {
                        t.setData(data);
                    }
                }
            }, 1);
        },
        shadowTemplate: `
<slot name="column"></slot>
<slot></slot>
<style type="text/javascript">
:host {
display:block;
width:100%;
width:-webkit-fill-available;
}
slot[name="column"] {
display:none;
}
</style>
`
    });
}
