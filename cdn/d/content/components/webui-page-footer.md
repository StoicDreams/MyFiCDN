<webui-page-segment elevation="10">
    The `<webui-page-footer>` component generates a standardized footer for your application. It automatically calculates the current copyright year, appends a `<webui-poweredby>` tag, and projects any child elements into a structured layout above the copyright notice.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-page-footer copyright="2022" company="Acme Corp">
            <webui-flex justify="center" gap="4">
                <webui-link href="/privacy">Privacy Policy</webui-link>
                <webui-link href="/terms">Terms of Service</webui-link>
            </webui-flex>
        </webui-page-footer>
    ```
    <webui-page-segment elevation="10" style="position:relative; min-height: 150px;">
        <webui-page-footer copyright="2022" company="Acme Corp">
            <webui-flex justify="center" gap="4">
                <webui-link href="/privacy">Privacy Policy</webui-link>
                <webui-link href="/terms">Terms of Service</webui-link>
            </webui-flex>
        </webui-page-footer>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/page-footer.js" language="javascript" label="page-footer.js"></webui-code>
