<webui-page-segment elevation="10">
    The `<webui-app-config>` component manages application configuration. It fetches a JSON configuration file specified by the `src` attribute and stores the parsed key-value pairs into the global state. Additional attributes placed directly on the element are also stored as configuration data.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-app-config src="appConfig.json" custom-setting="enabled"></webui-app-config>
    ```
    <webui-page-segment elevation="10">
        Loads configuration from `appConfig.json` and sets `custom-setting` to "enabled" in the application data.
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/app-config.js" language="javascript" label="app-config.js"></webui-code>
