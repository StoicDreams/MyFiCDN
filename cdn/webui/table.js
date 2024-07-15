/* Display Data in Table */
webui.define('webui-table', {
    constructor: (t) => {
        t._table = webui.create('table');
    },
    attr: ['bordered', 'columns', 'theme'],
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
            case 'theme':
                webui.removeClass(t._table, 'table-theme-');
                t._table.classList.add(`table-theme-${value}`);
                break;
        }
    },
    setData: function (data) {
        let t = this;
        data = data || {};
        if (typeof data === 'string') {
            t._data = JSON.parse(data);
        } else {
            t._data = data;
        }
        t.render();
    },
    render: function () {
        let t = this;
        t._table.innerHTML = '';
        let h = webui.create('tr');
        t._table.appendChild(h);
        t._columns.forEach(col => {
            let th = webui.create('th');
            let cd = col.split('|');
            th.innerHTML = webui.replaceAppData(cd[0]);
            h.appendChild(th);
        });
        if (t._data && t._data.forEach) {
            t._data.forEach(row => {
                let tr = webui.create('tr');
                t._table.appendChild(tr);
                t._columns.forEach(col => {
                    let cd = col.split('|');
                    let cm = col;
                    if (cd.length === 2) {
                        cm = cd[1];
                    }
                    let cc = webui.toCamel(cm);
                    let pc = webui.toPascel(cm);
                    let td = webui.create('td');
                    tr.appendChild(td);
                    let data = webui.getDefined(row[cm], row[cc], row[pc], '');
                    td.innerHTML = webui.replaceAppData(`${data}`);
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
    }
});
