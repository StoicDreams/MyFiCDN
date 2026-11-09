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

### HTML options

By default the dropdown is a native `<select>`, so option text is plain text. Add the `html-options` flag to show options as HTML instead, such as an icon or color swatch beside each name. The dropdown then opens its own list, with the same keyboard support as a select: arrow keys, Home, End, Enter or Space to pick, Escape to close, and typing a letter to jump to an option.

Each option's HTML comes from its `html` field (or the field named by `data-html`), then from a `slot="template"` with `{FIELD}` or `{TEMPLATE_FIELD}` placeholders (use the second form in page markdown, where `{NAME}` style placeholders are filled from app data first), then from its display text. Values put into a template are escaped, but an `html` field is used as it is, so only fill it from content you trust, never from user text. `value`, `display`, `data-name`, and `multiple` work the same in both modes.

<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex column>
            <webui-dropdown html-options label="Status" options='[{"id":"open","html":"<webui-icon icon=circle theme=success></webui-icon> Open"},{"id":"hold","html":"<webui-icon icon=circle theme=warning></webui-icon> On hold"},{"id":"closed","html":"<webui-icon icon=circle theme=danger></webui-icon> Closed"}]'></webui-dropdown>
            <webui-dropdown html-options multiple label="Tags" options='[{"id":"a","name":"Alpha"},{"id":"b","name":"Beta"}]'>
                <template slot="template"><webui-icon icon="tag"></webui-icon> <strong>{TEMPLATE_NAME}</strong></template>
            </webui-dropdown>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column>
            <webui-dropdown html-options label="Status" options='[{"id":"open","html":"<webui-icon icon=circle theme=success></webui-icon> Open"},{"id":"hold","html":"<webui-icon icon=circle theme=warning></webui-icon> On hold"},{"id":"closed","html":"<webui-icon icon=circle theme=danger></webui-icon> Closed"}]'></webui-dropdown>
            <webui-dropdown html-options multiple label="Tags" options='[{"id":"a","name":"Alpha"},{"id":"b","name":"Beta"}]'>
                <template slot="template"><webui-icon icon="tag"></webui-icon> <strong>{TEMPLATE_NAME}</strong></template>
            </webui-dropdown>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/dropdown.js" language="javascript" label="dropdown.js"></webui-code>
