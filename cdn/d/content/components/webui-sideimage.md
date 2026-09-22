<webui-page-segment elevation="10">
    The `<webui-sideimage>` component creates a split-layout presentation, positioning an image alongside text content. It automatically centers and aligns the items, and supports the `reverse` attribute to flip the image to the opposite side.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-sideimage src="[https://cdn.myfi.ws/v/Vecteezy/cartoon-style-cloud-storage-data-processing-message.svg](https://cdn.myfi.ws/v/Vecteezy/cartoon-style-cloud-storage-data-processing-message.svg)" alt="Cloud Storage">
            <webui-page-segment elevation="10">
                <h3>Cloud Integration</h3>
                <p>Easily manage and deploy your assets utilizing our integrated cloud network.</p>
            </webui-page-segment>
        </webui-sideimage>
    ```
    <webui-page-segment elevation="10">
        <webui-sideimage src="https://cdn.myfi.ws/v/Vecteezy/cartoon-style-cloud-storage-data-processing-message.svg" alt="Cloud Storage">
            <webui-page-segment elevation="10">
                <h3>Cloud Integration</h3>
                <p>Easily manage and deploy your assets utilizing our integrated cloud network.</p>
            </webui-page-segment>
        </webui-sideimage>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/sideimage.js" language="javascript" label="sideimage.js"></webui-code>
