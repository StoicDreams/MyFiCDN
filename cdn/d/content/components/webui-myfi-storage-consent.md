<webui-page-segment elevation="10">
    The `<webui-myfi-storage-consent>` component renders a compliance interface allowing users to choose their preferred data storage method. It provides detailed explanations for "Single Session/Tab Storage" (high security) versus "Long-term Storage" (convenience) and interfaces directly with the `webui.storage` API to persist the user's choice.
</webui-page-segment>

> **Note:** This component will be updated soon to conform to updated WebUI security standards.

<webui-side-by-side>
    ```html:Code Snippet
        <webui-myfi-storage-consent></webui-myfi-storage-consent>
    ```
    <webui-page-segment elevation="10">
        <webui-myfi-storage-consent></webui-myfi-storage-consent>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/myfi-storage-consent.js" language="javascript" label="myfi-storage-consent.js"></webui-code>
