<webui-page-segment elevation="10">
    The `<webui-stoic-dreams-logo>` component renders the official Stoic Dreams scalable vector (SVG) logo. It allows dynamic text injection for customized internal branding utilizing the `text` and `text2` attributes while maintaining the core shape, colors, and layout of the emblem. 
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex column gap="4" align="center">
            <!-- Logo with single text line -->
            <webui-stoic-dreams-logo text="App"></webui-stoic-dreams-logo>
            <!-- Logo with two text lines -->
            <webui-stoic-dreams-logo text="Web" text2="UI"></webui-stoic-dreams-logo>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column gap="4" align="center">
            <webui-stoic-dreams-logo text="App"></webui-stoic-dreams-logo>
            <webui-stoic-dreams-logo text="Web" text2="UI"></webui-stoic-dreams-logo>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/stoic-dreams-logo.js" language="javascript" label="stoic-dreams-logo.js"></webui-code>
