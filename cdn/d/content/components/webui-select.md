<webui-page-segment elevation="10">
    The `<webui-select>` component is a field like `<webui-dropdown>` that opens its options as a grid of square tiles in a dialog, rather than in a list. Each tile shows its option's icon above its name. An option without an icon gets a monogram: its initials on a tile in two of the theme's colors, which its name chooses, so tiles tell apart. Set the options with `options`, as JSON or as `Display|id, Other|id2`. Each option has an `id` (or `value`), a `display` name, and an optional `icon` or `image`, the address of a picture to show instead, and `data-id`, `data-display`, `data-icon`, and `data-image` name other fields to read. `value` sets the choice, `label`, `icon`, `mid-icon`, and `end-icon` work as they do on the dropdown, and `title` names the dialog. The `multiple` flag lets several tiles be chosen, with Done to close, and `disabled` turns it off. `item-size` sets the tiles' smallest width. With more than 12 options, the dialog adds a field to filter them. A pick fires `input` and `change`, and `data-bind`, `data-trigger`, and `data-name` work as they do on the dropdown.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-select label="Project" value="docs" options='[{"id":"store","display":"Acme Storefront"},{"id":"docs","display":"Docs","icon":"book-open"},{"id":"api","display":"Payments API"},{"id":"site","display":"Website","icon":"globe"}]'></webui-select>
    ```
    <webui-page-segment elevation="10">
        <webui-select label="Project" value="docs" options='[{"id":"store","display":"Acme Storefront"},{"id":"docs","display":"Docs","icon":"book-open"},{"id":"api","display":"Payments API"},{"id":"site","display":"Website","icon":"globe"}]'></webui-select>
    </webui-page-segment>
</webui-side-by-side>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-select label="Teams" multiple title="Choose teams" options="Design|design, Engineering|eng, Marketing|marketing, Support|support"></webui-select>
    ```
    <webui-page-segment elevation="10">
        <webui-select label="Teams" multiple title="Choose teams" options="Design|design, Engineering|eng, Marketing|marketing, Support|support"></webui-select>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/select.js" language="javascript" label="select.js"></webui-code>
