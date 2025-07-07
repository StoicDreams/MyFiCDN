"use strict"
{
    const tableContent = `
<webui-table theme="inherit" columns="[columns]" bordered class="my-3">
[innerhtml]
</webui-table>
`;
    const pagination = `<webui-pagination class="my-a" data-subscribe loop max-pages="3"></webui-pagination>`;
    function getReportHtml(report) {
        const data = report.data || [];
        const phtml = pagination.replace(/\[id\]/g, report._id).replace('data-subscribe', `data-subscribe="pag-${report._id}-index:setValue|pag-${report._id}-report:setData"`);
        let columns = report.appendColumns ? `${report.columns};${report.appendColumns}` : report.columns;
        let chtml = tableContent.replace(/\[id\]/g, report._id).replace('[innerhtml]', report._tableActions).replace('[columns]', columns);
        if (!report.bordered) {
            chtml = chtml.replace('bordered ', '');
        }
        if (report.label) {
            chtml = `<webui-grid theme="inherit" columns="auto max-content">
<h3>${report.label}</h3>${phtml}
</webui-grid>${chtml}${phtml}`;
        } else {
            chtml = `${phtml}${chtml}${phtml}`;
        }
        if (report.theme && ['info', 'success', 'warning', 'danger', 'primary', 'secondary', 'tertiary', 'white', 'black', 'shade', 'background', 'active', 'title'].indexOf(report.theme) !== -1) {
            chtml = chtml.replace(/"inherit"/g, `"${report.theme}"`);
        }
        return chtml;
    }
    function createError(message) {
        return webui.create('webui-alert', { variant: 'danger', html: message, show: true });
    }
    webui.define("webui-report", {
        content: true,
        watchVisibility: false,
        isInput: false,
        preload: '',
        perPage: 10,
        page: 1,
        data: [],
        columns: '',
        sortOrder: 'asc',
        sortColumn: '',
        constructor: (t) => {
            t._id = webui.uuid();
            t._tableActions = t.innerHTML;
        },
        flags: ['bordered'],
        attr: ['height', 'max-height', 'label', 'api', 'per-page', 'columns', 'append-columns', 'sort-order', 'sort-column', 'theme'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'api':
                    if (t._isRendered) {
                        setTimeout(() => {
                            t.loadData();
                        }, 1);
                    }
                    break;
                case 'height':
                    t.style.height = webui.pxIfNumber(value);
                    break;
                case 'maxHeight':
                    t.style.maxHeight = webui.pxIfNumber(value);
                    break;
            }
        },
        connected: function (t) {
            t.setupComponent();
        },
        disconnected: function (t) { },
        reconnected: function (t) { },
        setupComponent: function () {
            const t = this;
            t.render();
        },
        loadData: function () {
            const t = this;
            if (!t.sortColumn) {
                t.appendChild(createError('Report is missing default sort-column'));
                return;
            }
            if (!t.sortOrder) {
                t.sortOrder = 'asc';
            }
            if (!t.api) {
                t.appendChild(createError('Report is missing api'));
                return;
            }
            let request = {
                perPage: t.perPage,
                page: t.page,
                sortColumn: t.sortColumn,
                sortOrder: t.sortOrder
            };
            let json = JSON.stringify(request);
            if (t._req === json) return;
            t._req = json;
            webui.fetchApi(t.api, request)
                .then(async resp => {
                    if (t._req !== json) return;
                    if (resp.status === 200) {
                        const data = await resp.json();
                        if (!t.columns && data.columns) {
                            if (t.appendColumns) {
                                t._table.setAttribute('columns', `${data.columns};${t.appendColumns}`);
                            } else {
                                t._table.setAttribute('columns', data.columns);
                            }
                        }
                        t._table.setData(data.items);
                        t._pag.forEach(p => {
                            p.perPage = t.perPage;
                            p.pageCount = data.pageCount;
                            p.totalCount = data.total;
                            p.setValue(data.page);
                        });
                    } else {
                        const ex = await resp.text();
                        t.appendChild(createError(`API Error: ${ex}`));
                    }
                })
                .catch(ex => {
                    t.appendChild(createError(`API Error: ${ex}`));
                });
        },
        setPage: function (page) {
            const t = this;
            if (!page || page === t.page) return;
            t.page = page;
            t.loadData();
        },
        render: function () {
            const t = this;
            t.innerHTML = getReportHtml(t);
            t.loadData();
            t._table = t.querySelector('webui-table');
            t._pag = t.querySelectorAll('webui-pagination');
            t.setAttribute('data-subscribe', `pag-${t._id}-index:setPage`);
            t._isRendered = true;
        }
    });
}
