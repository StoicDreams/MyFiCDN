<webui-page-segment elevation="10">
    The `<webui-dropdown>` component renders an enhanced select menu. It supports loading options directly from JSON arrays, delimited strings, or external API endpoints. It features customizable icons, labels, and support for multiple selections.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex column>
            <webui-dropdown label="Static Options" theme="primary" options="Option 1:opt1,Option 2:opt2,Option 3:opt3" icon="list"></webui-dropdown>
            <webui-dropdown label="JSON Options" theme="secondary" options='[{"id":"1","display":"Item A"},{"id":"2","display":"Item B"}]'></webui-dropdown>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column>
            <webui-dropdown label="Static Options" theme="primary" options="Option 1:opt1,Option 2:opt2,Option 3:opt3" icon="list"></webui-dropdown>
            <webui-dropdown label="JSON Options" theme="secondary" options='[{"id":"1","display":"Item A"},{"id":"2","display":"Item B"}]'></webui-dropdown>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/dropdown.js" language="javascript" label="dropdown.js"></webui-code>
