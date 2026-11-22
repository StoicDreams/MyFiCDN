<webui-page-segment elevation="10">
    The `<webui-grid>` component is a layout utility that applies CSS Grid properties to its container. It simplifies responsive grid creation by allowing you to define `columns`, `gap`, `min`, and `max` constraints directly via HTML attributes, automatically handling dynamic resizing and wrapping for child elements.
</webui-page-segment>

### Attributes

- **`columns`:** a number of columns, or any CSS `grid-template-columns` value, such as `1fr 2fr`. Without it, as many columns as fit.
- **`min`** and **`max`:** the narrowest and widest a column can be. Numbers are pixels. `width` sets the narrowest too.
- **`height`:** the shortest each item can be. Numbers are pixels.
- **`gap`:** the space between items. Numbers are pixels.


<webui-side-by-side>
    ```html:Code Snippet
        <webui-grid columns="3" gap="4" min="100" max="1fr">
            <webui-button theme="primary">Grid Item 1</webui-button>
            <webui-button theme="secondary">Grid Item 2</webui-button>
            <webui-button theme="tertiary">Grid Item 3</webui-button>
            <webui-button theme="info">Grid Item 4</webui-button>
        </webui-grid>
    ```
    <webui-page-segment elevation="10">
        <webui-grid columns="3" gap="4" min="100" max="1fr">
            <webui-button theme="primary">Grid Item 1</webui-button>
            <webui-button theme="secondary">Grid Item 2</webui-button>
            <webui-button theme="tertiary">Grid Item 3</webui-button>
            <webui-button theme="info">Grid Item 4</webui-button>
        </webui-grid>
    </webui-page-segment>
</webui-side-by-side>

### Item width and height

<webui-side-by-side>
    ```html:Code Snippet
        <webui-grid width="120" height="60" gap="8">
            <webui-paper theme="info">At least 120px wide</webui-paper>
            <webui-paper theme="success">and 60px tall</webui-paper>
            <webui-paper theme="warning">Columns fit the room</webui-paper>
        </webui-grid>
    ```
    <webui-page-segment elevation="10">
        <webui-grid width="120" height="60" gap="8">
            <webui-paper theme="info">At least 120px wide</webui-paper>
            <webui-paper theme="success">and 60px tall</webui-paper>
            <webui-paper theme="warning">Columns fit the room</webui-paper>
        </webui-grid>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/grid.js" language="javascript" label="grid.js"></webui-code>
