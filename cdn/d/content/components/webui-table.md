<webui-page-segment elevation="10">
    The `<webui-table>` component renders dynamic data tables with built-in support for column alignment, sorting, custom column templates, and conditional HTML formatting. It populates data via the `data-subscribe` attribute and constructs columns based on a semicolon-delimited `columns` definition.
</webui-page-segment>

### Attributes

- **`columns`:** the columns, separated by `;`. Each is a heading, or `Heading|field` to read another field. Colons align it: `:Name` left, `Name:` right, and `:Name:` centered.
- **`sortable`:** the columns that sort when their heading is pressed, separated by `;`, each with its first direction, such as `name:asc;age:desc`. A third part, as in `name:asc:default`, makes it the starting sort.
- **`current-sort`** and **`current-sort-dir`:** the column it is sorted by and its direction, which it updates as headings are pressed, firing `update-sort`.
- **`column-formats`:** `field:html` for columns whose values or templates are shown as markup, separated by `;`. Other columns show text.
- **`bordered`:** draws lines between cells.
- **`data-subscribe="key:setData"`** (or `data-bind`): the rows, as a list of objects.

A sortable heading is a button, so the keyboard sorts with it, and screen readers hear which way the column sorts.


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

### Sorting and markup columns

<webui-side-by-side>
    ```html:Code Snippet
        <webui-table columns="Name|name;Age:|age" sortable="name:asc;age:desc" current-sort="age" current-sort-dir="desc" column-formats="name:html" data-subscribe="sample-table-sort:setData"></webui-table>
        <webui-data>
            <template slot="json" name="sample-table-sort">
                [{"name":"<strong>Ada</strong>","age":36},{"name":"<em>Grace</em>","age":85}]
            </template>
        </webui-data>
    ```
    <webui-page-segment elevation="10">
        <webui-table columns="Name|name;Age:|age" sortable="name:asc;age:desc" current-sort="age" current-sort-dir="desc" column-formats="name:html" data-subscribe="sample-table-sort:setData"></webui-table>
        <webui-data>
            <template slot="json" name="sample-table-sort">
                [{"name":"<strong>Ada</strong>","age":36},{"name":"<em>Grace</em>","age":85}]
            </template>
        </webui-data>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/table.js" language="javascript" label="table.js"></webui-code>
