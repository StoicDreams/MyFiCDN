<webui-page-segment elevation="10">
    The `<webui-fa>` component seamlessly integrates Font Awesome icons into your application. It dynamically fetches and caches the SVG path for the specified icon on demand, saving bandwidth. It also supports displaying an integrated numerical `count` badge overlaid on the icon.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex gap="4">
            <!-- Basic Font Awesome Icon -->
            <webui-fa icon="user"></webui-fa>
            <!-- Font Awesome Icon with Count Badge -->
            <webui-fa icon="bell" count="5"></webui-fa>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex gap="4" align="center" justify="center">
            <webui-fa icon="user"></webui-fa>
            <webui-fa icon="bell" count="5"></webui-fa>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/fa.js" language="javascript" label="fa.js"></webui-code>
