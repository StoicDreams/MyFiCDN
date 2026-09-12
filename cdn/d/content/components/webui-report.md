<webui-page-segment elevation="10">
    The `<webui-report>` component provides a complete, data-driven reporting interface. It automatically integrates a `<webui-table>` and `<webui-pagination>`, handling API data fetching, sorting, filtering, and responsive display. It uses the `api` attribute to fetch data and supports dynamic `columns` and `filters`.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-report
            label="User Report"
            api="/api/users"
            per-page="10"
            columns="ID|id;Name|name;Email|email"
            sort-column="id"
            theme="primary"
            bordered>
        </webui-report>
    ```
    <webui-page-segment elevation="10">
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

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/report.js" language="javascript" label="report.js"></webui-code>
