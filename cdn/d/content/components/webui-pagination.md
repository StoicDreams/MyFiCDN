<webui-page-segment elevation="10">
    The `<webui-pagination>` component renders a pagination control to navigate through large datasets or lists. It supports attributes to manage the current `page`, `per-page` items, `total-count`, and can optionally `loop` through pages. It integrates closely with data subscriptions to automatically update external components.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-pagination per-page="10" max-pages="5" loop data-subscribe="my-list-index:setValue"></webui-pagination>
    ```
    <webui-page-segment elevation="10">
        <webui-pagination per-page="10" max-pages="5" loop></webui-pagination>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/pagination.js" language="javascript" label="pagination.js"></webui-code>
