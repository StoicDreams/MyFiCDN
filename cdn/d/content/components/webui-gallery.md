<webui-page-segment elevation="10">
    The `<webui-gallery>` component dynamically builds an interactive image gallery. Provide a JSON endpoint via the `src` attribute containing an array of image objects (e.g., `[{"name": "...", "src": "..."}]`), and it will automatically render a main image viewer alongside a responsive thumbnail grid. Clicking a thumbnail updates the main display area.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-gallery src="/api/gallery.json" card-width="150"></webui-gallery>
    ```
    <webui-page-segment elevation="10">
        <webui-gallery src="/api/gallery.json" card-width="150"></webui-gallery>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/gallery.js" language="javascript" label="gallery.js"></webui-code>
