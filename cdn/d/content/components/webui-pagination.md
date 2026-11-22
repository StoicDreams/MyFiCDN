<webui-page-segment elevation="10">
    The `<webui-pagination>` component renders a pagination control to navigate through large datasets or lists. It supports attributes to manage the current `page`, `per-page` items, `total-count`, and can optionally `loop` through pages. It integrates closely with data subscriptions to automatically update external components.
</webui-page-segment>

### Attributes

- **`value`** (or **`page`**): the current page, starting at 1.
- **`per-page`:** items per page. The default is 20.
- **`per-page-options`:** the page sizes to offer, such as `10,25,50`. Without it, 10, 20, 50, and 100 are offered, plus `per-page`.
- **`hide-per-page`:** leaves out the page size choice.
- **`max-pages`:** how many page numbers show at once. The default is 10, and `0` shows none.
- **`hide-pages`:** leaves out the page numbers.
- **`hide-prev-next-buttons`:** leaves out the first, previous, next, and last buttons.
- **`loop`:** next on the last page goes to the first, and previous on the first to the last.
- **`data-subscribe="key:setData"`:** the list to page through.
- **`data-current="key"`:** the data key that gets the current page's items, or the current item when `per-page` is 1.


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

### Paging through a list

<webui-side-by-side>
    ```html:Code Snippet
        <webui-pagination per-page="2" per-page-options="2,4" max-pages="3" hide-prev-next-buttons value="2" data-subscribe="demo-pagination-list:setData" data-current="demo-pagination-page"></webui-pagination>
        <webui-data>
            <template slot="json" name="demo-pagination-list">["One","Two","Three","Four","Five","Six"]</template>
        </webui-data>
        <webui-code lang="json" data-subscribe="demo-pagination-page"></webui-code>
    ```
    <webui-page-segment elevation="10">
        <webui-pagination per-page="2" per-page-options="2,4" max-pages="3" hide-prev-next-buttons value="2" data-subscribe="demo-pagination-list:setData" data-current="demo-pagination-page"></webui-pagination>
        <webui-data>
            <template slot="json" name="demo-pagination-list">["One","Two","Three","Four","Five","Six"]</template>
        </webui-data>
        <webui-code lang="json" data-subscribe="demo-pagination-page"></webui-code>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/pagination.js" language="javascript" label="pagination.js"></webui-code>
