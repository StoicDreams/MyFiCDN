<webui-page-segment elevation="10">
    The `<webui-file-select>` component replaces the standard HTML file input with a stylized button interface. It automatically reads the selected files via the `FileReader` API (converting images/PDFs to Data URLs and JSON/XML/text to raw text) and pushes an array of file objects to the configured `data-trigger` state key.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex column>
            <!-- Single File Selection -->
            <webui-file-select label="Upload Profile Picture" accept="image/*" theme="primary" data-trigger="profile-pic-upload"></webui-file-select>

            <!-- Multiple File Selection -->
            <webui-file-select label="Upload Documents" multiple accept=".txt,.pdf" theme="secondary" data-trigger="doc-uploads"></webui-file-select>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column>
            <webui-file-select label="Upload Profile Picture" accept="image/*" theme="primary" data-trigger="profile-pic-upload"></webui-file-select>
            <webui-file-select label="Upload Documents" multiple accept=".txt,.pdf" theme="secondary" data-trigger="doc-uploads"></webui-file-select>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/file-select.js" language="javascript" label="file-select.js"></webui-code>
