<webui-page-segment elevation="10">
    The `<webui-report>` component provides a complete, data-driven reporting interface. It automatically integrates a `<webui-table>` and `<webui-pagination>`, handling API data fetching, sorting, filtering, and responsive display. It uses the `api` attribute to fetch data and supports dynamic `columns` and `filters`.
</webui-page-segment>

### Attributes

- **`api`:** the address the report asks for its rows, sending `page`, `perPage`, `sortColumn`, `sortOrder`, and its filters. The answer has `items`, `total`, `page`, and optionally `columns` and `columnFormats`.
- **`sort-column`** (required) and **`sort-order`:** the starting sort, `asc` (the default) or `desc`.
- **`columns`**, **`sortable`**, and **`column-formats`:** as on `<webui-table>`. Without `columns`, the API's are used.
- **`append-columns`:** columns added after the API's, such as an action column filled by a `slot="column"` template, shown as markup.
- **`filters`:** data keys, separated by `;`, whose values are sent with the request. A change to them loads the report again.
- **`required-filters`:** fields that must have a value before the report loads. Until then it shows no rows.
- **`per-page`:** rows per page. The default is 10.
- **`label`:** a heading above the report.
- **`height`** and **`max-height`:** its height. Numbers are pixels.
- **`bordered`** and **`theme`:** as on `<webui-table>`.


<webui-side-by-side>
    ```html:Code Snippet
        <webui-input-range label="Record Count" min="5" max="105" step="5" value="5" data-subscribe="mock-report-filter.recordCount:setValue" data-trigger="mock-report-filter.recordCount"></webui-input-range>
        <webui-report label="Results" api="/mock/report" filters="mock-report-filter" sort-column="name" bordered theme="info" sortable="id;name;note" append-columns=":Action:" data-subscribe="report-refresh:loadData">
            <template slot="column" name="action">
                <webui-button theme="info" start-icon="test|fill" data-value="{TEMPLATE_ROWDATA}" data-trigger="action-{_ROWID}" title="Call Dialog for {TEMPLATE_NAME}"></webui-button>
                <webui-dialog-action title="Action {TEMPLATE_NAME}" data-subscribe="action-{_ROWID}">
                    <template>
                        <webui-page-segment>
                            This is an example dialog for {TEMPLATE_NAME}.
                        </webui-page-segment>
                        <webui-code label="Row Data">{TEMPLATE_ROWDATA}</webui-code>
                    </template>
                </webui-dialog-action>
            </template>
        </webui-report>
    ```
    <webui-page-segment elevation="10">
        <webui-input-range label="Record Count" min="5" max="105" step="5" value="5" data-subscribe="mock-report-filter.recordCount:setValue" data-trigger="mock-report-filter.recordCount"></webui-input-range>
        <webui-report label="Results" api="/mock/report" filters="mock-report-filter" sort-column="name" bordered theme="info" sortable="id;name;note" append-columns=":Action:" data-subscribe="report-refresh:loadData">
            <template slot="column" name="action">
                <webui-button theme="info" start-icon="test|fill" data-value="{TEMPLATE_ROWDATA}" data-trigger="action-{_ROWID}" title="Call Dialog for {TEMPLATE_NAME}"></webui-button>
                <webui-dialog-action title="Action {TEMPLATE_NAME}" data-subscribe="action-{_ROWID}">
                    <template>
                        <webui-page-segment>
                            This is an example dialog for {TEMPLATE_NAME}.
                        </webui-page-segment>
                        <webui-code label="Row Data">{TEMPLATE_ROWDATA}</webui-code>
                    </template>
                </webui-dialog-action>
            </template>
        </webui-report>
    </webui-page-segment>
</webui-side-by-side>

### Sorting, page size, and required filters

<webui-side-by-side>
    ```html:Code Snippet
        <webui-report label="Ten Per Page" api="/mock/report" sort-column="name" sort-order="desc" per-page="10" columns="ID|id;Name|name;Note|note" column-formats="note:html" required-filters="recordCount" filters="mock-report-filter" max-height="400"></webui-report>
    ```
    <webui-page-segment elevation="10">
        <webui-report label="Ten Per Page" api="/mock/report" sort-column="name" sort-order="desc" per-page="10" columns="ID|id;Name|name;Note|note" column-formats="note:html" required-filters="recordCount" filters="mock-report-filter" max-height="400"></webui-report>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/report.js" language="javascript" label="report.js"></webui-code>
