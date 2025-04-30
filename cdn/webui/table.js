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
        constructor: (t) => {
            t._table = webui.create('table');
            t._columnTemplates = {};
            webui.removeElements(t, '[slot="column"]', n => {
                let key = n.dataset.name || n.dataset.key || n.getAttribute('name') || n.getAttribute('key');
                if (key === undefined) return;
                t._columnTemplates[key] = n.innerHTML;
            });
        },
        attr: ['bordered', 'columns'],
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
                t._data = JSON.parse(data);
            } else {
                t._data = data;
            }
            t.render();
        },
        render: function () {
            const t = this;
            t._table.innerHTML = '';
            let h = webui.create('tr');
            t._table.appendChild(h);
            t._columns.forEach(col => {
                let cd = col.split('|')[0].trim();
                let [display, align] = getAlign(cd);
                let th = webui.create('th', { 'class': align });
                th.innerHTML = webui.replaceAppData(display);
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
