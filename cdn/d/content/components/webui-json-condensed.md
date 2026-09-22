<webui-page-segment elevation="10">
    The `<webui-json-condensed>` component parses and condenses complex JSON objects or strings down to a specified character limit per property value. It is useful for generating compact, high-level summaries of large data structures for preview or logging purposes before piping them to other targets.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <!-- Condense long text strings inside JSON payloads -->
        <webui-json-condensed limit="15" value='{"title": "Very long title description here", "id": 1}' data-trigger="condensed-output"></webui-json-condensed>
        <webui-code lang="json" data-subscribe="condensed-output"></webui-code>
    ```
    <webui-page-segment elevation="10">
        <webui-json-condensed limit="15" value='{"title": "Very long title description here", "id": 1}' data-trigger="condensed-output"></webui-json-condensed>
        <webui-code lang="json" data-subscribe="condensed-output"></webui-code>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/json-condensed.js" language="javascript" label="json-condensed.js"></webui-code>
