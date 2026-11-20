<webui-page-segment elevation="10">
    The `<webui-select>` component is a field like `<webui-dropdown>` that opens its options as a grid of square tiles in a panel by the field, rather than in a list. The panel opens under the field, or above it when there is more room there, sizes itself to its tiles, and scrolls only when they don't fit in the window. A pick, a click elsewhere, or Escape closes it. Each tile shows its option's icon above its name. An option without an icon gets a monogram: its initials on a tile in two of the theme's colors, which its name chooses, so tiles tell apart. Set the options with `options`, as JSON or as `Display|id, Other|id2`. Each option has an `id` (or `value`), a `display` name, and an optional `icon` or `image`, the address of a picture to show instead, which fills the tile's width so a wide photo stays clear, and an optional `badge`, markup the page supplies (never text from data), such as counts, shown beside the name. `data-id`, `data-display`, `data-icon`, `data-image`, and `data-badge` name other fields to read. Options set while the panel is open redraw its tiles. `value` sets the choice, `label`, `icon`, `mid-icon`, and `end-icon` work as they do on the dropdown, and `title` names the list for screen readers. The `multiple` flag lets several tiles be chosen, keeping the panel open until a click elsewhere, `disabled` turns it off, and `icon-only` shows just the chosen option's picture in the field, keeping the names in the tiles. `item-size` sets the tiles' smallest width. With more than 12 options, the panel adds a field to filter them. A pick fires `input` and `change`, and `data-bind`, `data-trigger`, and `data-name` work as they do on the dropdown.
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
