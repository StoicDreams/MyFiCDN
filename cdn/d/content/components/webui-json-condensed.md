<webui-page-segment elevation="10">
    The `<webui-json-condensed>` component parses and condenses complex JSON objects or strings down to a specified character limit per property value. It is useful for generating compact, high-level summaries of large data structures for preview or logging purposes before piping them to other targets.
</webui-page-segment>

### Attributes

- **`value`:** the JSON to condense, as text or an object.
- **`data-subscribe="key"`:** condenses the data at that key instead, again whenever it changes.
- **`limit`:** how many characters of each value to keep. The default is 20.
- **`data-trigger="key"`:** the data key that gets the condensed JSON.


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

### Condensing bound data

<webui-side-by-side>
    ```html:Code Snippet
        <webui-json-condensed limit="8" data-subscribe="demo-json-source" data-trigger="demo-json-short"></webui-json-condensed>
        <webui-input-message label="JSON" data-trigger="demo-json-source" value='{"name":"A long name to cut","note":"Some more text"}'></webui-input-message>
        <webui-code lang="json" data-subscribe="demo-json-short"></webui-code>
    ```
    <webui-page-segment elevation="10">
        <webui-json-condensed limit="8" data-subscribe="demo-json-source" data-trigger="demo-json-short"></webui-json-condensed>
        <webui-input-message label="JSON" data-trigger="demo-json-source" value='{"name":"A long name to cut","note":"Some more text"}'></webui-input-message>
        <webui-code lang="json" data-subscribe="demo-json-short"></webui-code>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/json-condensed.js" language="javascript" label="json-condensed.js"></webui-code>
