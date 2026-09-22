<webui-page-segment elevation="10">
    The `<webui-loading-bar>` component renders horizontal loading bars to indicate progress or background tasks. It supports explicit completion percentages, indeterminate activity states, stripe animations, and customizable themes and heights.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex column gap="3">
            <!-- Indeterminate Striped Loader -->
            <webui-loading-bar indeterminate striped theme="primary" height="6"></webui-loading-bar>

            <!-- Percentage Progress Bar -->
            <webui-loading-bar theme="success" percent="75" height="4"></webui-loading-bar>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column gap="3">
            <webui-loading-bar indeterminate striped theme="primary" height="6"></webui-loading-bar>
            <webui-loading-bar theme="success" percent="75" height="4"></webui-loading-bar>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/loading-bar.js" language="javascript" label="loading-bar.js"></webui-code>
