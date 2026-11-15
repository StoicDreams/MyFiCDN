<webui-page-segment elevation="10">
    The `<webui-markdown-guide>` component is a short cheat sheet for people who write Markdown in a site or tool, such as notes, comments, or documents. It lists what to type for each kind of formatting, so every site shows the same guide instead of writing its own.

    It shows the formatting nearly every Markdown renderer supports. Use `include` to add rows for extras your renderer supports, and `exclude` to leave out rows it doesn't. Put a note about anything specific to your site, such as HTML being removed, beside the guide. A good place for the guide is a `webui-page-help` bubble, with a `webui-tabs` tab for it when the page has other help.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-markdown-guide></webui-markdown-guide>

        <webui-markdown-guide include="strikethrough task-list" exclude="table"></webui-markdown-guide>
    ```
    <webui-page-segment elevation="10">
        <webui-markdown-guide></webui-markdown-guide>
    </webui-page-segment>
</webui-side-by-side>

### Attributes

| Attribute | Description |
|---|---|
| `include` | Optional rows to add, separated by spaces or commas: `strikethrough`, `image`, `task-list`, `rule`, and `paragraph`. `all` adds every one. |
| `exclude` | Rows to leave out, by the same names. The rows shown by default are `heading`, `bold`, `italic`, `link`, `bullet-list`, `numbered-list`, `inline-code`, `code-block`, `quote`, and `table`. |
| `theme` | Color theme of the table. Defaults to `info`, like tables in page content. |
| `result-label`, `type-label` | Column headings. Default to `To get` and `Type`. |

### Methods

| Method | Description |
|---|---|
| `rowKeys()` | The names of the rows shown, in order. |

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/markdown-guide.js" language="javascript" label="markdown-guide.js"></webui-code>
