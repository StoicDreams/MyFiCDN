<webui-page-segment elevation="10">
    The `<webui-link>` component provides an interactive hyperlink element with support for optional starting and ending icons. It automatically handles internal SPA routing for relative paths and opens external targets based on the `target` attribute.
</webui-page-segment>

### Attributes

- **`href`:** where it goes. Paths on this site load in place, and other addresses open in this tab.
- **`target`:** opens it in another window, such as `_blank`.
- **`icon`** (or **`start-icon`**) and **`end-icon`:** icons before and after the text.

With an `href` it is a link, reached with Tab and followed with Enter. Without one but with `data-trigger` or `onclick`, it is a button, pressed with Enter or Space.


<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex column gap="2">
            <!-- Internal Page Link -->
            <webui-link href="/about" start-icon="exclamation">About Page</webui-link>

            <!-- External Window Link -->
            <webui-link href="https://github.com/StoicDreams" target="_blank" end-icon="arrow-corner-from-square">GitHub Repo</webui-link>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column gap="2">
            <webui-link href="/about" start-icon="exclamation">About Page</webui-link>
            <webui-link href="https://github.com/StoicDreams" target="_blank" end-icon="arrow-corner-from-square">GitHub Repo</webui-link>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### An icon, and a link that runs a trigger

<webui-side-by-side>
    ```html:Code Snippet
        <webui-link href="/components#webui-button" icon="link">Button docs</webui-link>
        <webui-link data-trigger="demo-link-pressed" data-value="pressed" end-icon="check">Runs a trigger</webui-link>
    ```
    <webui-page-segment elevation="10">
        <webui-link href="/components#webui-button" icon="link">Button docs</webui-link>
        <webui-link data-trigger="demo-link-pressed" data-value="pressed" end-icon="check">Runs a trigger</webui-link>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/link.js" language="javascript" label="link.js"></webui-code>
