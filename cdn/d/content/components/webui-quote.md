<webui-page-segment elevation="10">
    The `<webui-quote>` component stylizes text as a blockquote. It supports custom coloring via the `theme` attribute, drop shadows via `elevation`, and can include an automatic attribution line using the `cite` attribute.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex column gap="4">
            <webui-quote theme="info">
                This is a standard quote block without attribution.
            </webui-quote>

            <webui-quote theme="primary" cite="Marcus Aurelius" elevation="5">
                You have power over your mind - not outside events. Realize this, and you will find strength.
            </webui-quote>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column gap="4">
            <webui-quote theme="info">
                This is a standard quote block without attribution.
            </webui-quote>
            <webui-quote theme="primary" cite="Marcus Aurelius" elevation="5">
                You have power over your mind - not outside events. Realize this, and you will find strength.
            </webui-quote>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/quote.js" language="javascript" label="quote.js"></webui-code>
