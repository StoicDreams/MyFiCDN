<webui-page-segment elevation="10">
    The `<webui-tiles>` component lays its children out as tiles in a grid, as many to a row as fit, so a long list of things, such as projects or files, can be scanned at a glance. `min` is the narrowest a tile can be, and is 16em by default, and `gap` is the space between tiles. Numbers are pixels. A child with the `wide` attribute takes a whole row, such as a tile being edited.

    With `find`, a field above the tiles, labeled with its value, finds them as you type. A tile shows when every word typed is in its `data-find`, or in its text when it has none, ignoring case. Beside the field it says how many tiles there are, or how many of them match, using `count-label` as the singular and plural, such as `project|projects`. When nothing matches, it shows `empty`. Setting the `query` property finds tiles as typing does, and each change sends a `filter` event with `query`, `shown`, and `total` in its `detail`.

    With `label`, the tiles are a list by that name for screen readers, and each tile is one of its items, unless the page gave it a role of its own. A tile with the `hidden` attribute stays hidden and is not counted.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-tiles find="Find a fruit" count-label="fruit|fruits" empty="No fruit matches that." min="120">
            <webui-paper data-find="apple red">Apple</webui-paper>
            <webui-paper data-find="banana yellow">Banana</webui-paper>
            <webui-paper data-find="cherry red">Cherry</webui-paper>
            <webui-paper data-find="lime green">Lime</webui-paper>
        </webui-tiles>
    ```
    <webui-page-segment elevation="10">
        <webui-tiles find="Find a fruit" count-label="fruit|fruits" empty="No fruit matches that." min="120">
            <webui-paper data-find="apple red">Apple</webui-paper>
            <webui-paper data-find="banana yellow">Banana</webui-paper>
            <webui-paper data-find="cherry red">Cherry</webui-paper>
            <webui-paper data-find="lime green">Lime</webui-paper>
        </webui-tiles>
    </webui-page-segment>
</webui-side-by-side>

### A named list with a small gap

<webui-side-by-side>
    ```html:Code Snippet
        <webui-tiles label="Fruit" gap="4" min="90">
            <webui-paper>Apple</webui-paper>
            <webui-paper>Banana</webui-paper>
            <webui-paper>Cherry</webui-paper>
        </webui-tiles>
    ```
    <webui-page-segment elevation="10">
        <webui-tiles label="Fruit" gap="4" min="90">
            <webui-paper>Apple</webui-paper>
            <webui-paper>Banana</webui-paper>
            <webui-paper>Cherry</webui-paper>
        </webui-tiles>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/tiles.js" language="javascript" label="tiles.js"></webui-code>
