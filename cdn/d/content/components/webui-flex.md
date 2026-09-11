<webui-page-segment elevation="10">
    The `<webui-flex>` component is a layout utility that applies CSS Flexbox properties to its container. It accepts attributes like `column`, `grow`, `justify`, `align`, and `gap` to quickly construct layout hierarchies without writing custom CSS classes. It also supports `wrap-at` for responsive wrapping based on specific pixel widths.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <!-- Row Layout -->
        <webui-flex gap="2" justify="center" align="center">
            <webui-button theme="primary">One</webui-button>
            <webui-button theme="secondary">Two</webui-button>
            <webui-button theme="tertiary">Three</webui-button>
        </webui-flex>

        <!-- Column Layout -->
        <webui-flex column gap="4">
            <webui-alert show variant="success">First Alert</webui-alert>
            <webui-alert show variant="warning">Second Alert</webui-alert>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column gap="6">
            <webui-flex gap="2" justify="center" align="center">
                <webui-button theme="primary">One</webui-button>
                <webui-button theme="secondary">Two</webui-button>
                <webui-button theme="tertiary">Three</webui-button>
            </webui-flex>
            <webui-flex column gap="4">
                <webui-alert show variant="success">First Alert</webui-alert>
                <webui-alert show variant="warning">Second Alert</webui-alert>
            </webui-flex>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/flex.js" language="javascript" label="flex.js"></webui-code>
