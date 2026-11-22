<webui-page-segment elevation="10">
    The `<webui-input-message>` component renders a multi-line textarea input field with automatic height adjustment as text content expands. It includes support for custom labels, placeholders, tab indentation handling, and real-time sanitization of inputs to prevent script injection.
</webui-page-segment>

### Attributes

- **`value`** and **`placeholder`:** the text, and the hint shown while it is empty.
- **`height`** and **`max-height`:** its height, and the tallest it grows as text is added before it scrolls. Numbers are pixels.
- **`tab`:** what Shift+Tab types, such as four spaces. Empty, it types two spaces, and without it a tab character.
- **`sanitize`:** cleans markup out of the text as it is typed.
- **`readonly`:** shows the text but keeps it from being changed.
- **`title`:** names the box for screen readers when it has no `label`.
- **`name`**, **`autofocus`**, and **`disabled`:** as on `<webui-input-text>`.


<webui-side-by-side>
    ```html:Code Snippet
        <webui-input-message 
            label="Comments / Feedback" 
            placeholder="Type your message here..." 
            theme="primary">
        </webui-input-message>
    ```
    <webui-page-segment elevation="10">
        <webui-input-message 
            label="Comments / Feedback" 
            placeholder="Type your message here..." 
            theme="primary">
        </webui-input-message>
    </webui-page-segment>
</webui-side-by-side>

### Indenting, a height limit, and read only

<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex column gap="4">
            <webui-input-message title="Release notes" name="notes" tab="    " max-height="120" sanitize placeholder="Shift+Tab types four spaces"></webui-input-message>
            <webui-input-message label="Saved note" value="This note can't be changed." readonly></webui-input-message>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column gap="4">
            <webui-input-message title="Release notes" name="notes" tab="    " max-height="120" sanitize placeholder="Shift+Tab types four spaces"></webui-input-message>
            <webui-input-message label="Saved note" value="This note can't be changed." readonly></webui-input-message>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/input-message.js" language="javascript" label="input-message.js"></webui-code>
