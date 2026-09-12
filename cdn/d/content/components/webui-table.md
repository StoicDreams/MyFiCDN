<webui-page-segment elevation="10">
    The `<webui-table>` component renders dynamic data tables with built-in support for column alignment, sorting, custom column templates, and conditional HTML formatting. It populates data via the `data-subscribe` attribute and constructs columns based on a semicolon-delimited `columns` definition.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-data>
            <template slot="json" name="sample-table-data">
                [
                    {"id": 1, "name": "Item A", "status": "Active"},
                    {"id": 2, "name": "Item B", "status": "Inactive"}
                ]
            </template>
        </webui-data>
        <webui-table 
            theme="secondary" 
            columns="ID|id;Name|name;:Status:|status" 
            data-subscribe="sample-table-data:setData" 
            bordered>
        </webui-table>
    ```
    <webui-page-segment elevation="10">
        <webui-data>
            <template slot="json" name="sample-table-data">
                [
                    {"id": 1, "name": "Item A", "status": "Active"},
                    {"id": 2, "name": "Item B", "status": "Inactive"}
                ]
            </template>
        </webui-data>
        <webui-table theme="secondary" columns="ID|id;Name|name;:Status:|status" data-subscribe="sample-table-data:setData" bordered></webui-table>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/table.js" language="javascript" label="table.js"></webui-code>
