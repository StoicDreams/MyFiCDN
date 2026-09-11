<webui-page-segment elevation="10">
    The `<webui-feedback>` component provides a readily available, interactive feedback button. When clicked, it opens a modal dialog containing a `<webui-input-message>` element that prompts the user for feedback. The submitted message is then securely POSTed to the API endpoint defined in the `data-post` attribute.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-feedback 
            theme="primary" 
            flags="shape:circle backing border" 
            title="Provide us your feedback" 
            data-post="[https://api.myfi.ws/feedback/new](https://api.myfi.ws/feedback/new)" 
            data-json-name="message">
            <p>You can also come <a href="[https://discord.gg/5X4YSDFdHD](https://discord.gg/5X4YSDFdHD)">chat with us on Discord.</a></p>
        </webui-feedback>
    ```
    <webui-page-segment elevation="10">
        <webui-flex justify="center">
            <webui-feedback theme="primary" flags="shape:circle backing border" title="Provide us your feedback" data-post="https://api.myfi.ws/feedback/new" data-json-name="message">
                <p>You can also come <a href="https://discord.gg/5X4YSDFdHD">chat with us on Discord.</a></p>
            </webui-feedback>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/feedback.js" language="javascript" label="feedback.js"></webui-code>
