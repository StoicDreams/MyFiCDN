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

### Page Size

Every pagination offers a "Per page" choice of 10, 20, 50, or 100, with nothing to set up. The choice is saved for the session and shared, so changing it on one list changes it on every list, on every page.

- **`per-page`:** sets the size used until someone chooses one, and is added to the choices.
- **`per-page-options`:** replaces the choices, as in `per-page-options="15,30,60"`.
- **`hide-per-page`:** removes the choice. A pagination with `per-page="1"`, which shows one item at a time, has none either.

A new size fires a `per-page` event with the size as `detail`. Components that request one page at a time, like `<webui-report>`, use it to request the first page again at the new size.

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/pagination.js" language="javascript" label="pagination.js"></webui-code>
