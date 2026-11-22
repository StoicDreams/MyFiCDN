<webui-page-segment elevation="10">
    The `<webui-emoji>` component displays a specific emoji using the cross-platform "Noto Color Emoji" font to ensure visual consistency. It loads the emoji mapping dynamically from the CDN and requires the exact emoji string identifier via the `emoji` attribute.
</webui-page-segment>

### Attributes

- **`emoji`:** the emoji's name, such as `rocket`, as listed by `<webui-emoji-search>`.
- **`height`:** its size, as both its height and width. Numbers are pixels.
- **`max-height`:** the tallest it grows.


<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex gap="4">
            <webui-emoji emoji="rocket"></webui-emoji>
            <webui-emoji emoji="fire"></webui-emoji>
            <webui-emoji emoji="sparkles"></webui-emoji>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex gap="4" align="center" justify="center">
            <webui-emoji emoji="rocket"></webui-emoji>
            <webui-emoji emoji="fire"></webui-emoji>
            <webui-emoji emoji="sparkles"></webui-emoji>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Sized

<webui-side-by-side>
    ```html:Code Snippet
        <webui-emoji emoji="rocket" height="64"></webui-emoji>
        <webui-emoji emoji="fire" height="48" max-height="32"></webui-emoji>
    ```
    <webui-page-segment elevation="10">
        <webui-emoji emoji="rocket" height="64"></webui-emoji>
        <webui-emoji emoji="fire" height="48" max-height="32"></webui-emoji>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/emoji.js" language="javascript" label="emoji.js"></webui-code>
