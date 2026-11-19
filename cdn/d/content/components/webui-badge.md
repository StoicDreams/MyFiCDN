<webui-page-segment elevation="10">
    The `<webui-badge>` component is a small rounded label for a state or a count, such as Signed, Turned off, or 3. Put its text inside it. `theme` colors it with a theme color, such as `success` or `warning`, and without one it is a faint tint of the text color. `icon` puts a Web UI icon before the text.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-badge theme="success" icon="check">Signed</webui-badge>
        <webui-badge theme="warning">From a folder</webui-badge>
        <webui-badge theme="info">3 updates</webui-badge>
        <webui-badge>Turned off</webui-badge>
    ```
    <webui-page-segment elevation="10">
        <webui-badge theme="success" icon="check">Signed</webui-badge>
        <webui-badge theme="warning">From a folder</webui-badge>
        <webui-badge theme="info">3 updates</webui-badge>
        <webui-badge>Turned off</webui-badge>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/badge.js" language="javascript" label="badge.js"></webui-code>
