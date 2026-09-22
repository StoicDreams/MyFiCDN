<webui-page-segment elevation="10">
    The `<webui-paper>` component is a foundational layout container that provides a clean, stylized surface for organizing content. It supports standard global attributes like `elevation` and `theme` to control its drop shadow depth and background color context.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex gap="4">
            <webui-paper elevation="5" class="pa-4">Standard Paper</webui-paper>
            <webui-paper elevation="15" theme="primary" class="pa-4">Primary Themed Paper</webui-paper>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex gap="4">
            <webui-paper elevation="5" class="pa-4">Standard Paper</webui-paper>
            <webui-paper elevation="15" theme="primary" class="pa-4">Primary Themed Paper</webui-paper>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/paper.js" language="javascript" label="paper.js"></webui-code>
