<webui-page-segment elevation="10">
    The `<webui-line>` component renders a customizable horizontal separator rule. It supports optional theme coloring and custom sizing via the `size` attribute to match your application's design hierarchy.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <!-- Standard Line -->
        <webui-line></webui-line>

        <!-- Themed Line with Custom Size -->
        <webui-line theme="primary" size="4"></webui-line>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column>
            <webui-line></webui-line>
            <webui-line theme="primary" size="4"></webui-line>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/line.js" language="javascript" label="line.js"></webui-code>
