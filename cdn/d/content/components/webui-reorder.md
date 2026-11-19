<webui-page-segment elevation="10">
    The `<webui-reorder>` component lets people put its items in order, by dragging an item's handle, or by focusing the handle and pressing Alt+Up or Alt+Down. Each move sends a `reorder` event with the item that moved in `detail.item`, so a page can save the new order. A drag starts once the pointer moves a few pixels, so a click on a handle is still a click.

    Its children are the items, or the elements `items` matches anywhere inside it, so items can sit inside other elements, such as pages in a folder. `handle` is what a drag or key starts from, matched through shadow roots, and is `[data-reorder-handle]` by default. An item can be its own handle. `targets` lists the places an item can go, and is the items by default. A target with `place="above"` or `place="below"`, such as the start or end of a folder, always takes an item on that side, and never moves itself. An item inside another moves on its own, and moving the outer one carries what is in it. While a drag is going on, the component has the `dragging` attribute and the item `reorder-moving`.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-reorder>
            <webui-paper data-reorder-handle tabindex="0">First</webui-paper>
            <webui-paper data-reorder-handle tabindex="0">Second</webui-paper>
            <webui-paper data-reorder-handle tabindex="0">Third</webui-paper>
        </webui-reorder>
    ```
    <webui-page-segment elevation="10">
        <webui-reorder>
            <webui-paper data-reorder-handle tabindex="0">First</webui-paper>
            <webui-paper data-reorder-handle tabindex="0">Second</webui-paper>
            <webui-paper data-reorder-handle tabindex="0">Third</webui-paper>
        </webui-reorder>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/reorder.js" language="javascript" label="reorder.js"></webui-code>
