<webui-page-segment elevation="10">
    The `<webui-split-panes>` component shows two panes side by side, such as a list on the left and the item chosen from it on the right. Put the content of each in a child with `slot="start"` or `slot="end"`. Each pane scrolls on its own, so a table wider than its pane scrolls inside it.

    The bar between the panes resizes them. Drag it, or focus it and use the arrow keys, Home, and End. Double click it, or press Enter, to make the panes even again. `ratio` is the start pane's share of the width, from 0 to 1, and starts at 0.5. When the user resizes the panes, the component sets `ratio` and sends a `change` event with the new ratio in `detail.ratio`, so a page can save it and set it again next time.

    `min` is the narrowest each pane can be, in pixels, and is 400 by default. When there is not room for both panes at that width, the component gets the `narrow` attribute and the end pane covers the start pane, as a drawer does. A full height button down its left side, labeled with `start-label`, goes back to the start pane, and a full height button down the right side of the start pane, labeled with `end-label`, brings the end pane back. `show` says which pane is seen while narrow, `start` or `end`, and changing it sends a `show` event.

    With the `single` flag, the component is `narrow` at any width, so one pane shows at a time with the buttons to switch between them, as when a user prefers one pane at a time. Remove it to show the panes side by side again when there is room.

    With the `fill` flag, the panes are as tall as the visible part of whatever scrolls them, below where they start, and follow it as it is resized. Without it, give the component a height.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-split-panes ratio="0.5" min="150" start-label="List" end-label="Item" style="height:240px;">
            <div slot="start">
                <p>The list, which scrolls on its own.</p>
            </div>
            <div slot="end">
                <p>The item chosen from the list.</p>
            </div>
        </webui-split-panes>
    ```
    <webui-page-segment elevation="10">
        <webui-split-panes ratio="0.5" min="150" start-label="List" end-label="Item" style="height:240px;">
            <div slot="start" style="padding:var(--padding);">
                <p>The list, which scrolls on its own.</p>
            </div>
            <div slot="end" style="padding:var(--padding);">
                <p>The item chosen from the list.</p>
            </div>
        </webui-split-panes>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/split-panes.js" language="javascript" label="split-panes.js"></webui-code>
