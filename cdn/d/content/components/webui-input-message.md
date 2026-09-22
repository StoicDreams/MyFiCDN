<webui-page-segment elevation="10">
    The `<webui-input-message>` component renders a multi-line textarea input field with automatic height adjustment as text content expands. It includes support for custom labels, placeholders, tab indentation handling, and real-time sanitization of inputs to prevent script injection.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-input-message 
            label="Comments / Feedback" 
            placeholder="Type your message here..." 
            theme="primary" 
            rows="4">
        </webui-input-message>
    ```
    <webui-page-segment elevation="10">
        <webui-input-message 
            label="Comments / Feedback" 
            placeholder="Type your message here..." 
            theme="primary" 
            rows="4">
        </webui-input-message>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/input-message.js" language="javascript" label="input-message.js"></webui-code>
