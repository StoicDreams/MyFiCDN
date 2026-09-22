<webui-page-segment elevation="10">
    The `<webui-page-not-found>` component provides a standard 404 error page layout. It displays a "Page Not Found" message along with an illustrative graphic. If the global data key `app-not-found-html` is populated within the application's configuration, it will render that custom HTML instead of the default layout.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-page-not-found></webui-page-not-found>
    ```
    <webui-page-segment elevation="10">
        <webui-page-not-found></webui-page-not-found>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/page-not-found.js" language="javascript" label="page-not-found.js"></webui-code>
