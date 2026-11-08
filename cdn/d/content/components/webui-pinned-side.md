<webui-page-segment elevation="10">
    The `<webui-pinned-side>` component is a two column layout. Content in the default slot fills the main column, and content with `slot="side"` fills a side column that stays in view while the main column scrolls. When the component is narrower than `split-width` (900 pixels by default), it stacks into one column with the side after the first item. Use the `side-first` or `side-last` flag to move the side to the top or bottom instead. `side-width` sets the side column's width (`minmax(300px, 36%)` by default), and `gap` sets the space between items. Keep the side short enough to fit the screen; if it does not fit, it scrolls on its own.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-pinned-side split-width="600">
            <webui-page-segment elevation="10">Introduction</webui-page-segment>
            <webui-page-segment slot="side" elevation="10">Pinned side panel</webui-page-segment>
            <webui-page-segment elevation="10">More content that scrolls</webui-page-segment>
            <webui-page-segment elevation="10">Even more content</webui-page-segment>
        </webui-pinned-side>
    ```
    <webui-pinned-side split-width="600">
        <webui-page-segment elevation="10">Introduction</webui-page-segment>
        <webui-page-segment slot="side" elevation="10">Pinned side panel</webui-page-segment>
        <webui-page-segment elevation="10">More content that scrolls</webui-page-segment>
        <webui-page-segment elevation="10">Even more content</webui-page-segment>
    </webui-pinned-side>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/pinned-side.js" language="javascript" label="pinned-side.js"></webui-code>
