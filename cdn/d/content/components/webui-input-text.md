<webui-page-segment elevation="10">
    The `<webui-input-text>` component provides a flexible, single-line text input field supporting multiple types (such as text, number, and password). It includes built-in value sanitization, min/max length validation, autofocus handling, and seamless integration with global data triggers.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex column gap="4">
            <!-- Standard Text Input -->
            <webui-input-text label="Username" placeholder="Enter username..." theme="primary"></webui-input-text>

            <!-- Number Input with Min/Max -->
            <webui-input-text type="number" label="Age" min="1" max="120" value="25" theme="secondary"></webui-input-text>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column gap="4">
            <webui-input-text label="Username" placeholder="Enter username..." theme="primary"></webui-input-text>
            <webui-input-text type="number" label="Age" min="1" max="120" value="25" theme="secondary"></webui-input-text>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/input-text.js" language="javascript" label="input-text.js"></webui-code>
