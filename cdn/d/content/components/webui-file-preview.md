<webui-page-segment elevation="10">
    The `<webui-file-preview>` component provides an inline preview of files loaded into the application state. It dynamically swaps between an `<img>` element for image rendering and an `<iframe>` for other supported document types (like PDFs or text strings). It relies on a `setFile` data subscription to receive the file object array.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex column>
            <webui-file-select label="Select an Image or PDF" accept="image/*,application/pdf" data-trigger="preview-file-data"></webui-file-select>
            <webui-file-preview height="300" data-subscribe="preview-file-data:setFile"></webui-file-preview>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column>
            <webui-file-select label="Select an Image or PDF" accept="image/*,application/pdf" data-trigger="preview-file-data"></webui-file-select>
            <webui-file-preview height="300" data-subscribe="preview-file-data:setFile"></webui-file-preview>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/file-preview.js" language="javascript" label="file-preview.js"></webui-code>
