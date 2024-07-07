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
            th.innerHTML = webui.replaceAppData(col);
            h.appendChild(th);
        });
        if (t._data && t._data.forEach) {
            t._data.forEach(row => {
                let tr = webui.create('tr');
                t._table.appendChild(tr);
                t._columns.forEach(col => {
                    let cc = webui.toCamel(col);
                    let pc = webui.toPascel(col);
                    let td = webui.create('td');
                    tr.appendChild(td);
                    let cd = row[col] || row[cc] || row[pc] || '';
                    td.innerHTML = webui.replaceAppData(`${cd}`);
                });
            });
        }
    },
    connected: (t) => {
        t.appendChild(t._table);
        t.render();
    }
});
