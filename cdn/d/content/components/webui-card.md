<webui-page-segment elevation="10">
    The `<webui-card>` component displays content within a structured card layout. It automatically generates a styled header if the `name`, `avatar`, or `link` attributes are provided, and it projects nested child elements into its main body area.
</webui-page-segment>

## Card Variations

<webui-side-by-side>
    ```html:Code Snippet
        <!-- Basic Card -->
        <webui-card name="Simple Card" theme="primary">
            This is a simple card with some text content.
        </webui-card>

        <!-- Card with Avatar and Link -->
        <webui-card name="Profile Card" avatar="person|fill" link="/profile" theme="secondary">
            This card features an avatar and an external link icon in the header.
        </webui-card>

        <!-- Custom Width Card -->
        <webui-card name="Constrained Card" width="250" theme="info">
            This card has a maximum width set to 250px.
        </webui-card>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column>
            <webui-card name="Simple Card" theme="primary">
                This is a simple card with some text content.
            </webui-card>
            <webui-card name="Profile Card" avatar="person|fill" link="/profile" theme="secondary">
                This card features an avatar and an external link icon in the header.
            </webui-card>
            <webui-card name="Constrained Card" width="250" theme="info">
                This card has a maximum width set to 250px.
            </webui-card>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/card.js" language="javascript" label="card.js"></webui-code>
