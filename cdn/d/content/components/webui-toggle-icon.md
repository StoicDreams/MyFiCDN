<webui-page-segment elevation="10">
    The `<webui-toggle-icon>` component renders an interactive button that switches between an "on" and "off" state. It supports swapping icons, UI themes, and accessibility titles depending on its current state. It can operate independently or mirror the state of another component using the `data-enabled` attribute.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-toggle-icon
            label="Feature Toggle"
            icon-on="check|fill"
            icon-off="xmark"
            theme-on="success"
            theme-off="danger"
            title-on="Disable Feature"
            title-off="Enable Feature">
        </webui-toggle-icon>
    ```
    <webui-page-segment elevation="10">
        <webui-flex justify="center" align="center">
            <webui-toggle-icon label="Feature Toggle" icon-on="toggle-on|fill" icon-off="toggle-off" theme-on="success" theme-off="danger" title-on="Disable Feature" title-off="Enable Feature"></webui-toggle-icon>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/toggle-icon.js" language="javascript" label="toggle-icon.js"></webui-code>
