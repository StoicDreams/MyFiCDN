<webui-page-segment elevation="10">
    The `<webui-dialogs>` component acts as the central manager for modal overlays within the Web UI framework. By utilizing the native HTML5 `<dialog>` element, it provides accessible and performant modals. Once `<webui-dialogs></webui-dialogs>` is included in your DOM (typically at the root level), you can trigger interactive modals directly using inline HTML event handlers or complementary components.
</webui-page-segment>

## Dialogs Usage

<webui-side-by-side>
    ```html:Code Snippet
        <!-- The root dialogs container -->
        <webui-dialogs></webui-dialogs>

        <!-- Triggering the dialog directly via HTML -->
        <webui-button 
            theme="primary" 
            onclick="webui.dialog({ title: 'Interactive Dialog', content: 'This dialog was triggered directly from the HTML!', confirm: 'Close' })">
            Open Dialog
        </webui-button>
    ```
    <webui-page-segment elevation="10">
        <webui-button 
            theme="primary" 
            onclick="webui.dialog({ title: 'Interactive Dialog', content: 'This dialog was triggered directly from the HTML!', confirm: 'Close' })">
            Open Dialog
        </webui-button>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/dialogs.js" language="javascript" label="dialogs.js"></webui-code>
