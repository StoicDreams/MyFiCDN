<webui-page-segment elevation="10">
    The `<webui-code>` component displays formatted code snippets with automatic syntax highlighting. It supports various programming languages, features an integrated copy-to-clipboard button, allows custom labels, and can load code directly from external source files using the `src` attribute.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <!-- Basic Code Block -->
        <webui-code lang="javascript" label="example.js">
            function sayHello() {
                console.log("Hello, Web UI!");
            }
        </webui-code>

        <!-- Block Without Copy Button -->
        <webui-code lang="css" label="styles.css" nocopy>
            body {
                background-color: var(--color-background);
            }
        </webui-code>

        <!-- Loading from an External Source -->
        <webui-code src="[https://cdn.myfi.ws/webui/version](https://cdn.myfi.ws/webui/version)" lang="text" label="Version File"></webui-code>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column>
            <webui-code lang="javascript" label="example.js">
                function sayHello() {
                    console.log("Hello, Web UI!");
                }
            </webui-code>
            <webui-code lang="css" label="styles.css" nocopy>
                body {
                    background-color: var(--color-background);
                }
            </webui-code>
            <webui-code src="https://cdn.myfi.ws/webui/version" lang="text" label="Version File"></webui-code>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/code.js" language="javascript" label="code.js"></webui-code>
