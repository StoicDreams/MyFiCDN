<webui-page-segment elevation="10">
    The `<webui-input-range>` component renders a responsive slider input field with a real-time numeric value display. It supports standard slider configuration attributes like `min`, `max`, `step`, and `value`, and can use custom rendering functions via `onrender` to format the displayed value.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-input-range
            label="Volume Control"
            min="0"
            max="100"
            step="5"
            value="50"
            theme="primary">
        </webui-input-range>
    ```
    <webui-page-segment elevation="10">
        <webui-input-range
            label="Volume Control"
            min="0"
            max="100"
            step="5"
            value="50"
            theme="primary">
        </webui-input-range>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/input-range.js" language="javascript" label="input-range.js"></webui-code>
