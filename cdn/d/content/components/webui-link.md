<webui-page-segment elevation="10">
    The `<webui-link>` component provides an interactive hyperlink element with support for optional starting and ending icons. It automatically handles internal SPA routing for relative paths and opens external targets based on the `target` attribute.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex column gap="2">
            <!-- Internal Page Link -->
            <webui-link href="/about" start-icon="exclamation">About Page</webui-link>

            <!-- External Window Link -->
            <webui-link href="[https://github.com/StoicDreams](https://github.com/StoicDreams)" target="_blank" end-icon="arrow-corner-from-square">GitHub Repo</webui-link>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column gap="2">
            <webui-link href="/about" start-icon="exclamation">About Page</webui-link>
            <webui-link href="https://github.com/StoicDreams" target="_blank" end-icon="arrow-corner-from-square">GitHub Repo</webui-link>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/link.js" language="javascript" label="link.js"></webui-code>
