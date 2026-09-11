<webui-page-segment elevation="10">
    The `<webui-icon>` component renders scalable vector icons and emojis. It supports custom styling attributes like `theme`, `shape`, `stroke`, `shade`, `rotate`, and `bordered`. Icons can be configured using a single piped string format (e.g., `icon="bell|fill|theme:info"`) for clean code reuse across components.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex gap="4" align="center">
            <!-- Standard Icon -->
            <webui-icon icon="home" theme="primary"></webui-icon>

            <!-- Piped Configuration Icon -->
            <webui-icon icon="bell|fill|shade:tri|theme:success" width="32"></webui-icon>
            
            <!-- Icon with Backing Shape -->
            <webui-icon icon="star|fill|shape:circle|backing" theme="warning"></webui-icon>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex gap="4" align="center" justify="center">
            <webui-icon icon="home" theme="primary"></webui-icon>
            <webui-icon icon="bell|fill|shade:tri|theme:success" width="32"></webui-icon>
            <webui-icon icon="star|fill|shape:circle|backing" theme="warning"></webui-icon>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/icon.js" language="javascript" label="icon.js"></webui-code>
